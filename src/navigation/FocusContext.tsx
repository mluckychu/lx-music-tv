import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { UIManager, findNodeHandle } from 'react-native'
import { Direction, FocusNode, findNextFocus, wrapFocus } from './spatialNav'

interface FocusableEntry {
  ref: React.RefObject<any>
  rect: { x: number; y: number; width: number; height: number }
  onSelect?: () => void
  disabled?: boolean
}

interface FocusContextValue {
  current: string | null
  register: (id: string, ref: React.RefObject<any>, onSelect?: () => void, disabled?: boolean) => void
  unregister: (id: string) => void
  updateRect: (id: string, rect: FocusNode['rect']) => void
  setCurrent: (id: string) => void
  /** 方向键移动焦点，返回是否成功移动 */
  move: (dir: Direction) => boolean
  /** 确认键：触发当前焦点项的 onSelect */
  activate: () => void
  /** 滚动时重测所有焦点项绝对坐标，保证跨容器导航正确 */
  remeasure: () => void
  /** 进入新页面时把焦点重置到指定 id（不传则第一个注册项） */
  resetFocus: (id?: string) => void
}

const FocusContext = createContext<FocusContextValue | null>(null)

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const entries = useRef<Map<string, FocusableEntry>>(new Map())
  const [current, setCurrentState] = useState<string | null>(null)
  const currentRef = useRef<string | null>(null)

  const setCurrent = useCallback((id: string) => {
    currentRef.current = id
    setCurrentState(id)
  }, [])

  const register = useCallback(
    (id: string, ref: React.RefObject<any>, onSelect?: () => void, disabled?: boolean) => {
      entries.current.set(id, {
        ref,
        rect: { x: 0, y: 0, width: 0, height: 0 },
        onSelect,
        disabled,
      })
    },
    [],
  )

  const unregister = useCallback((id: string) => {
    entries.current.delete(id)
    if (currentRef.current === id) setCurrent('')
  }, [setCurrent])

  const updateRect = useCallback((id: string, rect: FocusNode['rect']) => {
    const e = entries.current.get(id)
    if (e) e.rect = rect
  }, [])

  const remeasure = useCallback(() => {
    entries.current.forEach((e, id) => {
      if (!e.disabled) measureNode(id, e.ref, updateRect)
    })
  }, [updateRect])

  const move = useCallback(
    (dir: Direction): boolean => {
      const list: FocusNode[] = []
      entries.current.forEach((e, id) => {
        if (e.disabled) return
        if (e.rect.width <= 0) return
        list.push({ id, rect: e.rect })
      })
      const from = currentRef.current
      if (!from) {
        const first = list[0]
        if (first) setCurrent(first.id)
        return !!first
      }
      let next = findNextFocus(from, dir, list)
      if (!next) next = wrapFocus(from, dir, list)
      if (next && next !== from) {
        setCurrent(next)
        return true
      }
      return false
    },
    [setCurrent],
  )

  const activate = useCallback(() => {
    const id = currentRef.current
    if (!id) return
    const e = entries.current.get(id)
    if (e && !e.disabled && e.onSelect) e.onSelect()
  }, [])

  const resetFocus = useCallback(
    (id?: string) => {
      if (id) {
        setCurrent(id)
        return
      }
      // 默认选第一个注册且未禁用的项
      let first: string | null = null
      entries.current.forEach((e, key) => {
        if (!first && !e.disabled) first = key
      })
      if (first) setCurrent(first)
    },
    [setCurrent],
  )

  const value = useMemo<FocusContextValue>(
    () => ({
      current,
      register,
      unregister,
      updateRect,
      setCurrent,
      move,
      activate,
      remeasure,
      resetFocus,
    }),
    [current, register, unregister, updateRect, setCurrent, move, activate, remeasure, resetFocus],
  )

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>
}

export function useFocus(): FocusContextValue {
  const ctx = useContext(FocusContext)
  if (!ctx) throw new Error('useFocus must be used inside <FocusProvider>')
  return ctx
}

/** 供 Focusable 在布局完成后重测自身绝对坐标 */
export function measureNode(id: string, ref: React.RefObject<any>, updateRect: (id: string, r: FocusNode['rect']) => void) {
  const node = ref.current ? findNodeHandle(ref.current) : null
  if (node == null) return
  UIManager.measure(node, (_x, _y, width, height, pageX, pageY) => {
    if (width == null || pageX == null) return
    updateRect(id, { x: pageX, y: pageY, width, height })
  })
}
