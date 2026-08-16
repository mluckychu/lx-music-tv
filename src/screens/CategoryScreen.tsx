import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import Header from '@/components/Header'
import SongTile from '@/components/SongTile'
import { TV } from '@/theme/tvTheme'
import { MusicInfo } from '@/sources/types'
import { sourceManager } from '@/sources'
import { CategoryParams } from '@/navigation/router'

interface CategoryScreenProps {
  params: CategoryParams
  onPlay: (list: MusicInfo[], index: number) => void
}

export function CategoryScreen({ params, onPlay }: CategoryScreenProps) {
  const [songs, setSongs] = useState<MusicInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    const src = sourceManager.getActive()
    const task =
      params.kind === 'list'
        ? src.getSongList(params.id ?? '')
        : params.kind === 'top'
        ? src.getTopList(params.id ?? '')
        : src.search(params.keyword ?? params.id ?? params.title, 1, 60)

    task
      .then((list) => {
        if (alive) setSongs(list)
      })
      .catch(() => {
        if (alive) setSongs([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [params.kind, params.id, params.keyword, params.title])

  return (
    <View>
      <Header title={params.title} subtitle={`共 ${songs.length} 首`} />
      {loading ? (
        <View style={{ padding: TV.spacing(80) }}>
          <ActivityIndicator size="large" color={TV.colors.primary} />
        </View>
      ) : songs.length === 0 ? (
        <View style={{ padding: TV.spacing(80) }}>
          <Text style={{ color: TV.colors.textMuted, fontSize: TV.fontSize.body }}>
            暂无内容（若已配置真实音源，请检查音源地址与网络）
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: TV.spacing(64), paddingBottom: TV.spacing(40) }}>
          {songs.map((song, i) => (
            <SongTile
              key={`${song.source}_${song.id}_${i}`}
              song={song}
              index={i}
              fid={`cat_${song.source}_${song.id}_${i}`}
              onSelect={() => onPlay(songs, i)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export default CategoryScreen
