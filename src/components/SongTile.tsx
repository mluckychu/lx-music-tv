import React from 'react'
import { Text, View } from 'react-native'
import Focusable from '@/navigation/Focusable'
import { TV } from '@/theme/tvTheme'
import { MusicInfo } from '@/sources/types'

interface SongTileProps {
  song: MusicInfo
  index: number
  fid: string
  onSelect: () => void
}

export function SongTile({ song, index, fid, onSelect }: SongTileProps) {
  return (
    <Focusable
      id={fid}
      onSelect={onSelect}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: TV.spacing(96),
        paddingHorizontal: TV.spacing(28),
        borderRadius: TV.radius.md,
        marginBottom: TV.spacing(12),
        backgroundColor: TV.colors.surface,
      }}
      focusStyle={{ backgroundColor: TV.colors.surfaceHover }}
    >
      {({ focused }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text
            style={{
              width: TV.spacing(70),
              fontSize: TV.fontSize.body,
              fontWeight: '800',
              color: focused ? TV.colors.primary : TV.colors.textMuted,
            }}
          >
            {index + 1}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: TV.colors.text, fontSize: TV.fontSize.body, fontWeight: '700' }} numberOfLines={1}>
              {song.name}
            </Text>
            <Text style={{ color: TV.colors.textMuted, fontSize: TV.fontSize.small }} numberOfLines={1}>
              {song.singer} · {song.album}
            </Text>
          </View>
          {song.interval ? (
            <Text style={{ color: TV.colors.textMuted, fontSize: TV.fontSize.small, marginLeft: TV.spacing(24) }}>
              {song.interval}
            </Text>
          ) : null}
        </View>
      )}
    </Focusable>
  )
}

export default SongTile
