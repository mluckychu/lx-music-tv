import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import Header from '@/components/Header'
import ChannelRow from '@/components/ChannelRow'
import { TV } from '@/theme/tvTheme'
import { ChannelRow as ChannelRowData, PosterItem } from '@/sources/types'
import { sourceManager } from '@/sources'

interface HomeScreenProps {
  onOpenItem: (item: PosterItem) => void
}

export function HomeScreen({ onOpenItem }: HomeScreenProps) {
  const [channels, setChannels] = useState<ChannelRowData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    sourceManager
      .getActive()
      .getHomeChannels()
      .then((rows) => {
        if (alive) setChannels(rows)
      })
      .catch(() => {
        if (alive) setChannels([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <View>
      <Header title="音乐大厅" subtitle="用方向键浏览频道，确认键进入" />
      {loading ? (
        <View style={{ padding: TV.spacing(80) }}>
          <ActivityIndicator size="large" color={TV.colors.primary} />
        </View>
      ) : (
        channels.map((row, i) => (
          <ChannelRow key={row.id} row={row} onOpenItem={onOpenItem} autoFocusFirst={i === 0} />
        ))
      )}
    </View>
  )
}

export default HomeScreen
