import { create } from 'zustand'
import { MusicInfo } from '@/sources/types'

interface LibraryState {
  favorites: MusicInfo[]
  recent: MusicInfo[]
  toggleFavorite: (song: MusicInfo) => void
  addRecent: (song: MusicInfo) => void
  isFavorite: (id: string) => boolean
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  favorites: [],
  recent: [],

  toggleFavorite: (song) => {
    const exists = get().favorites.some((s) => s.id === song.id && s.source === song.source)
    set({
      favorites: exists
        ? get().favorites.filter((s) => !(s.id === song.id && s.source === song.source))
        : [song, ...get().favorites],
    })
  },

  addRecent: (song) => {
    const list = get().recent.filter((s) => !(s.id === song.id && s.source === song.source))
    set({ recent: [song, ...list].slice(0, 50) })
  },

  isFavorite: (id) => get().favorites.some((s) => s.id === id),
}))
