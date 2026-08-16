import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Focusable from '@/navigation/Focusable'
import { TV } from '@/theme/tvTheme'
import { PosterItem } from '@/sources/types'

const GRADIENTS = [
  ['#ff7a8a', '#b5179e'],
  ['#4cc9f0', '#3a0ca3'],
  ['#f9c74f', '#f3722c'],
  ['#90be6d', '#277da1'],
  ['#f15bb5', '#9b5de5'],
  ['#00bbf9', '#00f5d4'],
  ['#ff9e00', '#ff0054'],
  ['#06d6a0', '#118ab2'],
]

function hashIndex(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % GRADIENTS.length
}

function Placeholder({ title, focused }: { title: string; focused: boolean }) {
  const [c1, c2] = GRADIENTS[hashIndex(title)]
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c1 }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c2, opacity: 0.55 }]} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: TV.fontSize.display, color: '#ffffff', fontWeight: '800', opacity: focused ? 1 : 0.92 }}>
          {title.slice(0, 1)}
        </Text>
      </View>
    </View>
  )
}

interface PosterCardProps {
  item: PosterItem
  onSelect: () => void
  /** 序号用于生成稳定的 focus id（同屏内唯一即可） */
  fid: string
}

export function PosterCard({ item, onSelect, fid }: PosterCardProps) {
  const size = TV.poster
  return (
    <Focusable
      id={fid}
      onSelect={onSelect}
      style={{ width: size.width, height: size.height + TV.spacing(74), marginRight: size.gap }}
    >
      {({ focused }) => (
        <View style={{ width: '100%', height: '100%' }}>
          <View
            style={[
              styles.box,
              {
                width: size.width,
                height: size.height,
                borderRadius: TV.radius.lg,
                overflow: 'hidden',
              },
            ]}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} />
            ) : (
              <Placeholder title={item.title} focused={focused} />
            )}
            {focused && (
              <View
                style={{
                  position: 'absolute',
                  top: TV.spacing(12),
                  right: TV.spacing(12),
                  backgroundColor: TV.colors.focusRing,
                  borderRadius: TV.spacing(8),
                  paddingHorizontal: TV.spacing(12),
                  paddingVertical: TV.spacing(4),
                }}
              >
                <Text style={{ color: '#1a1a1a', fontSize: TV.fontSize.small, fontWeight: '700' }}>确认播放</Text>
              </View>
            )}
          </View>
          <Text style={[styles.title, { fontSize: TV.fontSize.caption, marginTop: TV.spacing(14) }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.subtitle ? (
            <Text style={[styles.sub, { fontSize: TV.fontSize.small, marginTop: TV.spacing(4) }]} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>
      )}
    </Focusable>
  )
}

const styles = StyleSheet.create({
  box: { backgroundColor: TV.colors.surface },
  title: { color: TV.colors.text, fontWeight: '700' },
  sub: { color: TV.colors.textMuted },
})

export default PosterCard
