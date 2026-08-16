import React, { useState } from 'react'
import { ScrollView, Text, TextInput, View } from 'react-native'
import Header from '@/components/Header'
import SongTile from '@/components/SongTile'
import Focusable from '@/navigation/Focusable'
import { TV } from '@/theme/tvTheme'
import { MusicInfo } from '@/sources/types'
import { sourceManager } from '@/sources'

const HOT = ['周杰伦', '华语流行', '经典老歌', '轻音乐', '民谣', '影视原声', 'Beyond', '邓紫棋']

interface SearchScreenProps {
  onResult: (song: MusicInfo) => void
}

export function SearchScreen({ onResult }: SearchScreenProps) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<MusicInfo[]>([])
  const [loading, setLoading] = useState(false)

  const doSearch = async (q: string) => {
    const kw = q.trim()
    if (!kw) return
    setKeyword(kw)
    setLoading(true)
    try {
      const list = await sourceManager.getActive().search(kw, 1, 60)
      setResults(list)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <View>
      <Header title="搜索" subtitle="选择热门关键词，或用键盘输入" />

      <View style={{ paddingHorizontal: TV.spacing(64) }}>
        <Focusable
          id="search_input"
          style={{
            backgroundColor: TV.colors.surface,
            borderRadius: TV.radius.md,
            paddingHorizontal: TV.spacing(28),
            height: TV.spacing(96),
            justifyContent: 'center',
            marginBottom: TV.spacing(28),
          }}
          focusStyle={{ backgroundColor: TV.colors.surfaceHover }}
        >
          {() => (
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={() => doSearch(keyword)}
              placeholder="输入歌名 / 歌手 / 专辑"
              placeholderTextColor={TV.colors.textMuted}
              style={{ color: TV.colors.text, fontSize: TV.fontSize.body }}
            />
          )}
        </Focusable>

        <Text style={{ color: TV.colors.textMuted, fontSize: TV.fontSize.body, marginBottom: TV.spacing(16) }}>热门关键词</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {HOT.map((h) => (
            <Focusable
              key={h}
              id={`hot_${h}`}
              onSelect={() => doSearch(h)}
              style={{
                paddingHorizontal: TV.spacing(36),
                paddingVertical: TV.spacing(20),
                borderRadius: TV.radius.xl,
                backgroundColor: TV.colors.surface,
                marginRight: TV.spacing(20),
                marginBottom: TV.spacing(20),
              }}
              focusStyle={{ backgroundColor: TV.colors.primarySoft, borderWidth: TV.focusBorder, borderColor: TV.colors.focusRing }}
            >
              {() => <Text style={{ color: TV.colors.text, fontSize: TV.fontSize.body }}>{h}</Text>}
            </Focusable>
          ))}
        </View>

        {results.length > 0 && (
          <Text style={{ color: TV.colors.textSecondary, fontSize: TV.fontSize.heading, marginTop: TV.spacing(36), marginBottom: TV.spacing(16) }}>
            搜索结果
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: TV.spacing(64), paddingTop: TV.spacing(12), paddingBottom: TV.spacing(40) }}>
        {results.map((song, i) => (
          <SongTile
            key={`${song.source}_${song.id}_${i}`}
            song={song}
            index={i}
            fid={`res_${song.source}_${song.id}_${i}`}
            onSelect={() => onResult(song)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

export default SearchScreen
