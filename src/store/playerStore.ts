import { create } from 'zustand'
import { MusicInfo } from '@/sources/types'

interface PlayerState {
  queue: MusicInfo[]
  index: number
  current: MusicInfo | null
  isPlaying: boolean
  /** 当前播放进度（秒） */
  position: number
  /** 总时长（秒），由 interval 解析 */
  duration: number
  lyric: string
  /** 演示模式：音源无真实音频时进度仍走动但不出声 */
  demoMode: boolean

  playList: (list: MusicInfo[], startIndex?: number) => void
  playSong: (song: MusicInfo) => void
  togglePlay: () => void
  setPlaying: (v: boolean) => void
  next: () => void
  prev: () => void
  seek: (seconds: number) => void
  setProgress: (seconds: number) => void
  setLyric: (lyric: string) => void
  setDuration: (d: number) => void
  setDemoMode: (v: boolean) => void
}

function parseInterval(interval?: string): number {
  if (!interval) return 0
  const parts = interval.split(':').map((n) => parseInt(n, 10))
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return 0
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  index: -1,
  current: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  lyric: '',
  demoMode: false,

  playList: (list, startIndex = 0) => {
    const song = list[startIndex]
    set({
      queue: list,
      index: startIndex,
      current: song ?? null,
      isPlaying: !!song,
      position: 0,
      duration: parseInterval(song?.interval),
      demoMode: false,
    })
  },

  playSong: (song) => {
    set({
      queue: [song],
      index: 0,
      current: song,
      isPlaying: true,
      position: 0,
      duration: parseInterval(song.interval),
    })
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (v) => set({ isPlaying: v }),

  next: () => {
    const { queue, index } = get()
    if (queue.length === 0) return
    const ni = (index + 1) % queue.length
    const song = queue[ni]
    set({ index: ni, current: song, position: 0, duration: parseInterval(song.interval) })
  },

  prev: () => {
    const { queue, index, position } = get()
    if (queue.length === 0) return
    // 播放超过 3 秒时，上一曲先回到开头
    if (position > 3) {
      set({ position: 0 })
      return
    }
    const ni = (index - 1 + queue.length) % queue.length
    const song = queue[ni]
    set({ index: ni, current: song, position: 0, duration: parseInterval(song.interval) })
  },

  seek: (seconds) => set({ position: Math.max(0, seconds) }),
  setProgress: (seconds) => set({ position: seconds }),
  setLyric: (lyric) => set({ lyric }),
  setDuration: (d) => set({ duration: d }),
  setDemoMode: (v) => set({ demoMode: v }),
}))
