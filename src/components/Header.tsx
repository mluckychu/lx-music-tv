import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { TV } from '@/theme/tvTheme'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: TV.spacing(64),
        paddingTop: TV.spacing(48),
        paddingBottom: TV.spacing(24),
      }}
    >
      <View>
        <Text style={{ color: TV.colors.text, fontSize: TV.fontSize.display, fontWeight: '800' }}>{title}</Text>
        {subtitle ? (
          <Text style={{ color: TV.colors.textMuted, fontSize: TV.fontSize.body, marginTop: TV.spacing(8) }}>{subtitle}</Text>
        ) : null}
      </View>
      <Text style={{ color: TV.colors.textSecondary, fontSize: TV.fontSize.heading, fontWeight: '700' }}>
        {hh}:{mm}
      </Text>
    </View>
  )
}

export default Header
