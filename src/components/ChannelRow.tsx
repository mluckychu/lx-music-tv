import React, { useRef } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { TV } from '@/theme/tvTheme'
import { ChannelRow as ChannelRowData, PosterItem } from '@/sources/types'
import PosterCard from './PosterCard'
import { useFocus } from '@/navigation/FocusContext'

interface ChannelRowProps {
  row: ChannelRowData
  onOpenItem: (item: PosterItem) => void
  /** 该行的第一张卡片是否自动获焦（用于首页首行） */
  autoFocusFirst?: boolean
}

export function ChannelRow({ row, onOpenItem, autoFocusFirst }: ChannelRowProps) {
  const { remeasure } = useFocus()
  const lastScroll = useRef(0)

  return (
    <View style={{ marginBottom: TV.spacing(40) }}>
      <Text style={[styles.title, { fontSize: TV.fontSize.heading, marginLeft: TV.spacing(64), marginBottom: TV.spacing(20) }]}>
        {row.title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: TV.spacing(64), paddingVertical: TV.spacing(8) }}
        onScroll={() => {
          const now = Date.now()
          if (now - lastScroll.current > 120) {
            lastScroll.current = now
            remeasure()
          }
        }}
        scrollEventThrottle={120}
      >
        {row.items.map((item, i) => (
          <PosterCard
            key={item.id}
            item={item}
            fid={`${row.id}_${item.id}`}
            onSelect={() => onOpenItem(item)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  title: { color: TV.colors.text, fontWeight: '800' },
})

export default ChannelRow
