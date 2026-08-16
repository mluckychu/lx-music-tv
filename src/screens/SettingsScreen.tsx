import React from 'react'
import { Text, TextInput, View } from 'react-native'
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
  const { sourceUrl, sourceTag, quality, remoteEnabled, setSourceUrl, setSourceTag, setQuality, applySource } = useSettingStore()

  return (
    <View>
      <Header title="设置" subtitle="配置真实音源后即可播放" />
      <View style={{ paddingHorizontal: TV.spacing(64) }}>
        <Text style={labelStyle}>音源地址（留空使用内置演示源）</Text>
        <Focusable
          id="set_url"
          style={inputBox}
          focusStyle={{ backgroundColor: TV.colors.surfaceHover }}
        >
          {() => (
            <TextInput
              value={sourceUrl}
              onChangeText={setSourceUrl}
              placeholder="https://your-lx-source.example.com"
              placeholderTextColor={TV.colors.textMuted}
              style={{ color: TV.colors.text, fontSize: TV.fontSize.body }}
            />
          )}
        </Focusable>

        <Text style={[labelStyle, { marginTop: TV.spacing(36) }]}>音源标识</Text>
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

        <View style={{ flexDirection: 'row', marginTop: TV.spacing(48) }}>
          <Focusable id="set_apply" onSelect={applySource} style={btn} focusStyle={{ backgroundColor: TV.colors.primary }}>
            {() => <Text style={btnText}>保存并应用</Text>}
          </Focusable>
          <Focusable
            id="set_reset"
            onSelect={() => {
              setSourceUrl('')
              applySource()
            }}
            style={[btn, { marginLeft: TV.spacing(28), backgroundColor: TV.colors.surface }]}
            focusStyle={{ backgroundColor: TV.colors.surfaceHover }}
          >
            {() => <Text style={[btnText, { color: TV.colors.text }]}>恢复演示源</Text>}
          </Focusable>
        </View>

        <View style={{ marginTop: TV.spacing(40), padding: TV.spacing(28), backgroundColor: TV.colors.bgElevated, borderRadius: TV.radius.md }}>
          <Text style={{ color: TV.colors.textSecondary, fontSize: TV.fontSize.body, lineHeight: TV.fontSize.body * 1.6 }}>
            当前状态：{remoteEnabled ? '已连接真实音源' : '内置演示源（离线可演示，无真实音频）'}
            {'\n'}音源服务需实现 /search、/musicUrl、/lyric、/songlist、/toplist 等接口（详见 README）。
          </Text>
        </View>
      </View>
    </View>
  )
}

const labelStyle = { color: TV.colors.textSecondary, fontSize: TV.fontSize.body, marginBottom: TV.spacing(16), fontWeight: '700' }
const inputBox = {
  backgroundColor: TV.colors.surface,
  borderRadius: TV.radius.md,
  paddingHorizontal: TV.spacing(28),
  height: TV.spacing(96),
  justifyContent: 'center' as const,
  marginBottom: TV.spacing(8),
}
const btn = {
  backgroundColor: TV.colors.primarySoft,
  borderRadius: TV.radius.md,
  paddingHorizontal: TV.spacing(48),
  paddingVertical: TV.spacing(26),
}
const btnText = { color: TV.colors.primary, fontSize: TV.fontSize.body, fontWeight: '800' }

export default SettingsScreen
