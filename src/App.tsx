import React, { useEffect } from 'react'
import { ScrollView, StatusBar, View } from 'react-native'
import { FocusProvider, useFocus } from '@/navigation/FocusContext'
import RemoteHandler from '@/navigation/RemoteHandler'
import Sidebar, { NavItem } from '@/components/Sidebar'
import NowPlayingBar from '@/components/NowPlayingBar'
import { TV } from '@/theme/tvTheme'
import { useRouter, ScreenName, Route } from '@/navigation/router'
import { usePlayerStore } from '@/store/playerStore'

import HomeScreen from '@/screens/HomeScreen'
import SearchScreen from '@/screens/SearchScreen'
import SettingsScreen from '@/screens/SettingsScreen'
import CategoryScreen from '@/screens/CategoryScreen'
import PlayerScreen from '@/screens/PlayerScreen'

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: '首页', icon: '🏠' },
  { key: 'search', label: '搜索', icon: '🔍' },
  { key: 'settings', label: '设置', icon: '⚙️' },
]

function Shell() {
  const stack = useRouter((s) => s.stack)
  const navigate = useRouter((s) => s.navigate)
  const push = useRouter((s) => s.push)
  const pop = useRouter((s) => s.pop)
  const { remeasure } = useFocus()
  const togglePlay = usePlayerStore((s) => s.togglePlay)

  const current: Route = stack[stack.length - 1]
  const topName: ScreenName = current.name

  // 切换页面后重测坐标并允许焦点稳定
  useEffect(() => {
    const t = setTimeout(() => remeasure(), 80)
    return () => clearTimeout(t)
  }, [topName, current.params, remeasure])

  const renderScreen = () => {
    switch (topName) {
      case 'home':
        return <HomeScreen onOpenItem={(item) => openPoster(item)} />
      case 'search':
        return <SearchScreen onResult={(song) => playSongAndOpen(song)} />
      case 'settings':
        return <SettingsScreen />
      case 'category':
        return <CategoryScreen params={current.params?.category!} onPlay={(list, i) => { usePlayerStore.getState().playList(list, i); push('player') }} />
      case 'player':
        return <PlayerScreen />
    }
  }

  function openPoster(item: any) {
    if (item.type === 'song') {
      usePlayerStore.getState().playSong(item as any)
      push('player')
    } else {
      navigate('category', { category: { title: item.title, kind: item.type, id: item.payload?.listId ?? item.payload?.topId ?? item.payload?.genre ?? item.payload?.singer ?? item.payload?.theme, keyword: item.payload?.singer ?? item.title } })
    }
  }

  function playSongAndOpen(song: any) {
    usePlayerStore.getState().playSong(song)
    push('player')
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: TV.colors.bg }}>
      <StatusBar backgroundColor={TV.colors.bg} barStyle="light-content" />
      <Sidebar items={NAV_ITEMS} active={topName === 'player' ? (stack[stack.length - 2]?.name ?? 'home') : topName} onSelect={(k) => navigate(k as ScreenName)} />
      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: TV.spacing(180) }} keyboardShouldPersistTaps="handled">
          {renderScreen()}
        </ScrollView>
        <NowPlayingBar onOpen={() => push('player')} />
      </View>
      <RemoteHandler
        onMenu={() => pop()}
        onPlayPause={() => {
          if (usePlayerStore.getState().current) togglePlay()
        }}
      />
    </View>
  )
}

export default function App() {
  return (
    <FocusProvider>
      <Shell />
    </FocusProvider>
  )
}
