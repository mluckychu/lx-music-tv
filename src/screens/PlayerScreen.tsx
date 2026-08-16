import React, { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import Focusable from '@/navigation/Focusable'
import { TV } from '@/theme/tvTheme'
import { usePlayerStore } from '@/store/playerStore'
import { useSettingStore } from '@/store/settingStore'
import { sourceManager } from '@/sources'

function fmt(s: number): string {
  if (!s || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function ControlButton({ fid, label, onSelect }: { fid: string; label: string; onSelect: () => void }) {
  return (
    <Focusable
      id={fid}
      onSelect={onSelect}
      style={{
        width: TV.spacing(140),
        height: TV.spacing(140),
        borderRadius: TV.radius.xl,
        backgroundColor: TV.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: TV.spacing(28),
      }}
      focusStyle={{ backgroundColor: TV.colors.primary }}
    >
      {() => <Text style={{ color: TV.colors.text, fontSize: TV.fontSize.heading }}>{label}</Text>}
    </Focusable>
  )
}

export function PlayerScreen() {
  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const position = usePlayerStore((s) => s.position)
  const duration = usePlayerStore((s) => s.duration)
  const lyric = usePlayerStore((s) => s.lyric)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)
  const setProgress = usePlayerStore((s) => s.setProgress)
  const setDemoMode = usePlayerStore((s) => s.setDemoMode)
  const setLyric = usePlayerStore((s) => s.setLyric)

  const quality = useSettingStore((s) => s.quality)
  const [demoMode, setDemo] = useState(true)

  // 切换歌曲：拉取真实音频地址与歌词
  useEffect(() => {
    if (!current) return
    let alive = true
    const src = sourceManager.getActive()
    src
      .getMusicUrl(current, quality)
      .then(({ url }) => {
        if (!alive) return
        if (!url) {
          // 演示源：无真实音频，进入演示播放态（进度走动但不发声）
          setDemo(true)
          setDemoMode(true)
        } else {
          // 真实音源：此处应把 url 交给音频播放器（如 react-native-video）。
          // 例如: <Video source={{ uri: url }} ... onProgress={e=>setProgress(e.currentTime)} />
          setDemo(false)
          setDemoMode(false)
        }
      })
      .catch(() => {
        if (alive) {
          setDemo(true)
          setDemoMode(true)
        }
      })
    src.getLyric(current).then((l) => alive && setLyric(l))
    return () => {
      alive = false
    }
  }, [current?.id, current?.source, quality, setDemoMode, setLyric])

  // 演示模式：用计时器推进进度，到尾自动下一首
  useEffect(() => {
    if (!isPlaying || !demoMode) return
    const t = setInterval(() => {
      const st = usePlayerStore.getState()
      if (st.duration > 0 && st.position + 1 >= st.duration) st.next()
      else st.setProgress(st.position + 1)
    }, 1000)
    return () => clearInterval(t)
  }, [isPlaying, demoMode, setProgress])

  if (!current) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: TV.colors.textMuted, fontSize: TV.fontSize.body }}>暂无播放</Text>
      </View>
    )
  }

  const pct = duration > 0 ? Math.min(1, position / duration) : 0

  return (
    <View style={{ flex: 1, flexDirection: 'row', padding: TV.spacing(72), backgroundColor: TV.colors.bg }}>
      {/* 左侧大封面 */}
      <View
        style={{
          width: TV.spacing(560),
          height: TV.spacing(560),
          borderRadius: TV.radius.xl,
          backgroundColor: TV.colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: TV.fontSize.display, color: TV.colors.primary, fontWeight: '800' }}>
          {current.name.slice(0, 1)}
        </Text>
      </View>

      {/* 右侧信息 */}
      <View style={{ flex: 1, marginLeft: TV.spacing(64) }}>
        <Text style={{ color: TV.colors.text, fontSize: TV.fontSize.display, fontWeight: '800' }} numberOfLines={1}>
          {current.name}
        </Text>
        <Text style={{ color: TV.colors.textSecondary, fontSize: TV.fontSize.heading, marginTop: TV.spacing(16) }}>
          {current.singer} · {current.album}
        </Text>

        <View style={{ flexDirection: 'row', marginTop: TV.spacing(48), alignItems: 'center' }}>
          <ControlButton fid="pl_prev" label="⏮" onSelect={prev} />
          <ControlButton fid="pl_toggle" label={isPlaying ? '⏸' : '▶'} onSelect={togglePlay} />
          <ControlButton fid="pl_next" label="⏭" onSelect={next} />
          {demoMode && (
            <Text style={{ color: TV.colors.textMuted, fontSize: TV.fontSize.body, marginLeft: TV.spacing(20) }}>
              （演示播放，无真实音频）
            </Text>
          )}
        </View>

        {/* 进度条 */}
        <View style={{ marginTop: TV.spacing(40) }}>
          <View style={{ height: TV.spacing(14), backgroundColor: TV.colors.divider, borderRadius: TV.spacing(7) }}>
            <View style={{ height: '100%', width: `${pct * 100}%`, backgroundColor: TV.colors.primary, borderRadius: TV.spacing(7) }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: TV.spacing(12) }}>
            <Text style={{ color: TV.colors.textMuted, fontSize: TV.fontSize.body }}>{fmt(position)}</Text>
            <Text style={{ color: TV.colors.textMuted, fontSize: TV.fontSize.body }}>{fmt(duration)}</Text>
          </View>
        </View>

        {/* 歌词 */}
        <ScrollView style={{ marginTop: TV.spacing(40), flex: 1 }} contentContainerStyle={{ paddingBottom: TV.spacing(40) }}>
          <Text style={{ color: TV.colors.textSecondary, fontSize: TV.fontSize.body, lineHeight: TV.fontSize.body * 1.8 }}>
            {lyric || '暂无歌词'}
          </Text>
        </ScrollView>
      </View>
    </View>
  )
}

export default PlayerScreen
