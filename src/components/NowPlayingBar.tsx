import React from 'react'
import { Text, View } from 'react-native'
import Focusable from '@/navigation/Focusable'
import { TV } from '@/theme/tvTheme'
import { usePlayerStore } from '@/store/playerStore'

interface NowPlayingBarProps {
  onOpen: () => void
}

function fmt(s: number): string {
  if (!s || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function NowPlayingBar({ onOpen }: NowPlayingBarProps) {
  const current = usePlayerStore((s) => s.current)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const position = usePlayerStore((s) => s.position)
  const duration = usePlayerStore((s) => s.duration)

  if (!current) return null
  const pct = duration > 0 ? Math.min(1, position / duration) : 0

  return (
    <Focusable
      id="nowplaying_bar"
      onSelect={onOpen}
      style={{
        position: 'absolute',
        left: TV.spacing(64),
        right: TV.spacing(64),
        bottom: TV.spacing(28),
        height: TV.spacing(110),
        backgroundColor: TV.colors.bgElevated,
        borderRadius: TV.radius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: TV.spacing(36),
      }}
    >
      {() => (
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: TV.fontSize.heading, marginRight: TV.spacing(24) }}>{isPlaying ? '▶' : '⏸'}</Text>
          <View style={{ width: TV.spacing(620) }}>
            <Text style={{ color: TV.colors.text, fontSize: TV.fontSize.body, fontWeight: '700' }} numberOfLines={1}>
              {current.name}
            </Text>
            <Text style={{ color: TV.colors.textMuted, fontSize: TV.fontSize.small }} numberOfLines={1}>
              {current.singer} · {current.album}
            </Text>
          </View>
          <View style={{ flex: 1, marginHorizontal: TV.spacing(36) }}>
            <View style={{ height: TV.spacing(10), backgroundColor: TV.colors.divider, borderRadius: TV.spacing(5) }}>
              <View style={{ height: '100%', width: `${pct * 100}%`, backgroundColor: TV.colors.primary, borderRadius: TV.spacing(5) }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: TV.spacing(8) }}>
              <Text style={{ color: TV.colors.textMuted, fontSize: TV.fontSize.small }}>{fmt(position)}</Text>
              <Text style={{ color: TV.colors.textMuted, fontSize: TV.fontSize.small }}>{fmt(duration)}</Text>
            </View>
          </View>
          <Text style={{ color: TV.colors.textSecondary, fontSize: TV.fontSize.small }}>确认键打开播放页</Text>
        </View>
      )}
    </Focusable>
  )
}

export default NowPlayingBar
