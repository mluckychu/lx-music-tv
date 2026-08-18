import { create } from 'zustand'
import { sourceManager } from '@/sources'
import { configurePlayback } from '@/sources/lxmusic'

interface SettingState {
  /** 音源标识（kw/kg/mg/tx/wy ...） */
  sourceTag: string
  /** 默认音质 */
  quality: string
  /** 是否已连接洛雪真源码音源（false 为内置演示源） */
  remoteEnabled: boolean
  /** 播放地址服务器（lx-music-api-server 基址，如 https://your-server.com） */
  playbackServer: string
  /** 播放服务器 auth（服务端开启校验时填写） */
  playbackAuth: string

  setSourceTag: (tag: string) => void
  setQuality: (q: string) => void
  setPlaybackServer: (url: string) => void
  setPlaybackAuth: (auth: string) => void
  applySource: () => void
  useMock: () => void
}

export const useSettingStore = create<SettingState>((set, get) => ({
  sourceTag: 'kw',
  quality: '128k',
  remoteEnabled: true,
  playbackServer: '',
  playbackAuth: '',

  setSourceTag: (tag) => set({ sourceTag: tag }),
  setQuality: (q) => set({ quality: q }),
  setPlaybackServer: (url) => set({ playbackServer: url }),
  setPlaybackAuth: (auth) => set({ playbackAuth: auth }),

  applySource: () => {
    const { sourceTag, playbackServer, playbackAuth } = get()
    configurePlayback(playbackServer, playbackAuth)
    sourceManager.setLxSource(sourceTag)
    set({ remoteEnabled: true })
  },

  useMock: () => {
    sourceManager.useMock()
    set({ remoteEnabled: false })
  },
}))
