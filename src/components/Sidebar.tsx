import React from 'react'
import { Text, View } from 'react-native'
import Focusable from '@/navigation/Focusable'
import { TV } from '@/theme/tvTheme'

export interface NavItem {
  key: string
  label: string
  icon: string
}

interface SidebarProps {
  items: NavItem[]
  active: string
  onSelect: (key: string) => void
}

const W = 320

export function Sidebar({ items, active, onSelect }: SidebarProps) {
  return (
    <View
      style={{
        width: W,
        height: '100%',
        backgroundColor: TV.colors.bgElevated,
        paddingTop: TV.spacing(80),
        paddingHorizontal: TV.spacing(24),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: TV.spacing(70), paddingLeft: TV.spacing(16) }}>
        <View
          style={{
            width: TV.spacing(40),
            height: TV.spacing(40),
            borderRadius: TV.spacing(10),
            backgroundColor: TV.colors.primary,
            marginRight: TV.spacing(20),
          }}
        />
        <Text style={{ color: TV.colors.text, fontSize: TV.fontSize.title, fontWeight: '800' }}>洛雪音乐</Text>
      </View>

      {items.map((it) => (
        <Focusable
          key={it.key}
          id={`nav_${it.key}`}
          onSelect={() => onSelect(it.key)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: TV.spacing(28),
            paddingHorizontal: TV.spacing(24),
            borderRadius: TV.radius.md,
            marginBottom: TV.spacing(16),
            backgroundColor: active === it.key ? TV.colors.primarySoft : 'transparent',
          }}
          focusStyle={{ backgroundColor: TV.colors.surfaceHover }}
        >
          {({ focused }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: TV.fontSize.heading, marginRight: TV.spacing(24) }}>{it.icon}</Text>
              <Text
                style={{
                  fontSize: TV.fontSize.body,
                  fontWeight: active === it.key || focused ? '800' : '600',
                  color: active === it.key ? TV.colors.primary : TV.colors.textSecondary,
                }}
              >
                {it.label}
              </Text>
            </View>
          )}
        </Focusable>
      ))}
    </View>
  )
}

export default Sidebar
