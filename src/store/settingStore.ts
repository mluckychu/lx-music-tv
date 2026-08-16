import { create } from 'zustand'
import { sourceManager } from '@/sources'

interface SettingState {
  /** 真实音源服务地址（留空则使用内置演示源） */
  sourceUrl: string
  /** 音源标识（kw/kg/mg/tx/wy ...） */
  sourceTag: string
  /** 默认音质 */
  quality: string
  /** 是否已连接真实音源 */
  remoteEnabled: boolean

  setSourceUrl: (url: string) => void
  setSourceTag: (tag: string) => void
  setQuality: (q: string) => void
  applySource: () => void
}

export const useSettingStore = create<SettingState>((set, get) => ({
  sourceUrl: '',
  sourceTag: 'kw',
  quality: '128k',
  remoteEnabled: false,

  setSourceUrl: (url) => set({ sourceUrl: url }),
  setSourceTag: (tag) => set({ sourceTag: tag }),
  setQuality: (q) => set({ quality: q }),

  applySource: () => {
    const { sourceUrl, sourceTag } = get()
    if (sourceUrl.trim()) {
      sourceManager.setRemoteSource(sourceUrl.trim(), sourceTag)
      set({ remoteEnabled: true })
    } else {
      sourceManager.useMock()
      set({ remoteEnabled: false })
    }
  },
}))
