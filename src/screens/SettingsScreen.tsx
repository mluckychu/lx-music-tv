import React from 'react'
import { Text, View, TextInput } from 'react-native'
import Header from '@/components/Header'
import Focusable from '@/navigation/Focusable'
import { TV } from '@/theme/tvTheme'
import { useSettingStore } from '@/store/settingStore'

const TAGS = ['kw', 'kg', 'mg', 'tx', 'wy']
const QUALITIES = ['128k', '320k', 'flac']

function Chip({ label, active, onSelect, fid }: { label: string; active: boolean; onSelect: () => void; fid: string }) {
  return (
    <Focusable
      id={fid}
      onSelect={onSelect}
      style={{
        paddingHorizontal: TV.spacing(36),
        paddingVertical: TV.spacing(18),
        borderRadius: TV.radius.xl,
        backgroundColor: active ? TV.colors.primarySoft : TV.colors.surface,
        borderWidth: active ? TV.focusBorder : 0,
        borderColor: active ? TV.colors.focusRing : 'transparent',
        marginRight: TV.spacing(20),
      }}
    >
      {() => (
        <Text style={{ color: active ? TV.colors.primary : TV.colors.text, fontSize: TV.fontSize.body, fontWeight: '700' }}>{label}</Text>
      )}
    </Focusable>
  )
}

export function SettingsScreen() {
  const {
    sourceTag,
    quality,
    remoteEnabled,
    playbackServer,
    playbackAuth,
    setSourceTag,
    setQuality,
    setPlaybackServer,
    setPlaybackAuth,
    applySource,
    useMock,
  } = useSettingStore()

  return (
    <View>
      <Header title="设置" subtitle="洛雪真源码音源" />
      <View style={{ paddingHorizontal: TV.spacing(64) }}>
        <Text style={labelStyle}>音源（洛雪真源码协议）</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {TAGS.map((t) => (
            <Chip key={t} fid={`tag_${t}`} label={t} active={sourceTag === t} onSelect={() => setSourceTag(t)} />
          ))}
        </View>

        <Text style={[labelStyle, { marginTop: TV.spacing(36) }]}>默认音质</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {QUALITIES.map((q) => (
            <Chip key={q} fid={`q_${q}`} label={q} active={quality === q} onSelect={() => setQuality(q)} />
          ))}
        </View>

        <Text style={[labelStyle, { marginTop: TV.spacing(36) }]}>播放地址服务器（lx-music-api-server）</Text>
        <Text style={noteStyle}>
          各音源已启用反爬/签名，独立 App 无法直接获取播放地址。请部署 lx-music-api-server
          并填入其地址（如 https://your-server.com）；搜索/排行榜/歌词仍直连官方接口。
        </Text>
        <TextInput
          style={inputStyle}
          placeholder="https://your-lx-music-api-server.com"
          placeholderTextColor={TV.colors.textMuted}
          value={playbackServer}
          onChangeText={setPlaybackServer}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={[labelStyle, { marginTop: TV.spacing(28) }]}>服务器校验 auth（可选）</Text>
        <TextInput
          style={inputStyle}
          placeholder="留空表示不校验"
          placeholderTextColor={TV.colors.textMuted}
          value={playbackAuth}
          onChangeText={setPlaybackAuth}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <View style={{ flexDirection: 'row', marginTop: TV.spacing(48) }}>
          <Focusable id="set_apply" onSelect={applySource} style={btn} focusStyle={{ backgroundColor: TV.colors.primary }}>
            {() => <Text style={btnText}>保存并应用</Text>}
          </Focusable>
          <Focusable
            id="set_reset"
            onSelect={() => useMock()}
            style={[btn, { marginLeft: TV.spacing(28), backgroundColor: TV.colors.surface }]}
            focusStyle={{ backgroundColor: TV.colors.surfaceHover }}
          >
            {() => <Text style={[btnText, { color: TV.colors.text }]}>恢复演示源</Text>}
          </Focusable>
        </View>

        <View style={{ marginTop: TV.spacing(40), padding: TV.spacing(28), backgroundColor: TV.colors.bgElevated, borderRadius: TV.radius.md }}>
          <Text style={{ color: TV.colors.textSecondary, fontSize: TV.fontSize.body, lineHeight: TV.fontSize.body * 1.6 }}>
            当前音源：{remoteEnabled ? `洛雪真源码（${sourceTag}）` : '内置演示源（离线可演示，无真实音频）'}
            {'\n'}播放服务器：{playbackServer ? playbackServer : '（未配置，播放将提示设置）'}
          </Text>
        </View>
      </View>
    </View>
  )
}

const labelStyle = { color: TV.colors.textSecondary, fontSize: TV.fontSize.body, marginBottom: TV.spacing(16), fontWeight: '700' as const }
const noteStyle = { color: TV.colors.textMuted, fontSize: TV.fontSize.caption, lineHeight: TV.fontSize.caption * 1.5, marginBottom: TV.spacing(14) }
const inputStyle = {
  backgroundColor: TV.colors.surface,
  color: TV.colors.text,
  borderRadius: TV.radius.md,
  paddingHorizontal: TV.spacing(24),
  paddingVertical: TV.spacing(16),
  fontSize: TV.fontSize.body,
  borderWidth: 1,
  borderColor: TV.colors.divider,
}
const btn = {
  backgroundColor: TV.colors.primarySoft,
  borderRadius: TV.radius.md,
  paddingHorizontal: TV.spacing(48),
  paddingVertical: TV.spacing(26),
}
const btnText = { color: TV.colors.primary, fontSize: TV.fontSize.body, fontWeight: '800' as const }

export default SettingsScreen
