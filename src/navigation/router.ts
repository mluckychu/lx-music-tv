import { create } from 'zustand'

export type ScreenName = 'home' | 'search' | 'settings' | 'category' | 'player'

export interface CategoryParams {
  title: string
  kind: 'list' | 'top' | 'genre' | 'singer' | 'category' | 'search'
  id?: string
  keyword?: string
}

export interface ScreenParams {
  category?: CategoryParams
}

export interface Route {
  name: ScreenName
  params?: ScreenParams
}

interface RouterState {
  stack: Route[]
  push: (name: ScreenName, params?: ScreenParams) => void
  pop: () => void
  navigate: (name: ScreenName, params?: ScreenParams) => void
  reset: (name: ScreenName, params?: ScreenParams) => void
}

export const useRouter = create<RouterState>((set, get) => ({
  stack: [{ name: 'home' }],

  push: (name, params) => set({ stack: [...get().stack, { name, params }] }),
  pop: () => {
    const s = get().stack
    if (s.length > 1) set({ stack: s.slice(0, -1) })
  },
  navigate: (name, params) => {
    // 同级导航（如侧边栏切换）直接替换当前屏，避免栈无限增长
    const s = get().stack
    set({ stack: [...s.slice(0, -1), { name, params }] })
  },
  reset: (name, params) => set({ stack: [{ name, params }] }),
}))

export const router = useRouter
