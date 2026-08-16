import React, { useEffect, useRef } from 'react'
import {
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { TV } from '@/theme/tvTheme'
import { useFocus, measureNode } from './FocusContext'

interface FocusableProps {
  id: string
  onSelect?: () => void
  disabled?: boolean
  autoFocus?: boolean
  style?: StyleProp<ViewStyle>
  /** 焦点态额外样式（与默认放大+描边叠加） */
  focusStyle?: StyleProp<ViewStyle>
  /** 内容；可为函数，接收 { focused } 以自定义内部渲染 */
  children: React.ReactNode | ((state: { focused: boolean }) => React.ReactNode)
}

/**
 * 可获焦元素：电视遥控导航的基本单元。
 * - 自动注册到 FocusContext，参与方向键空间导航
 * - 焦点态：放大 + 高对比描边 + 外发光（远距离可见）
 * - 确认键 / 触摸点击都会触发 onSelect（去重避免双触发）
 */
export function Focusable({
  id,
  onSelect,
  disabled,
  autoFocus,
  style,
  focusStyle,
  children,
}: FocusableProps) {
  const { current, register, unregister, updateRect, setCurrent, remeasure } = useFocus()
  const ref = useRef<React.ElementRef<typeof Pressable>>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const lastFire = useRef(0)
  const focused = current === id

  const fire = () => {
    const now = Date.now()
    if (now - lastFire.current < 250) return // 去重：遥控 select 与 Pressable.onPress 可能同帧到达
    lastFire.current = now
    onSelectRef.current?.()
  }

  useEffect(() => {
    register(id, ref, fire, disabled)
    return () => unregister(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, disabled])

  useEffect(() => {
    if (autoFocus) setCurrent(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus])

  // 布局完成后测绝对坐标
  const handleLayout = () => {
    measureNode(id, ref, updateRect)
  }

  // 焦点变化时重测（处理滚动后位置变化），并让容器滚动到可见
  useEffect(() => {
    if (focused) {
      measureNode(id, ref, updateRect)
      ref.current?.setNativeProps?.({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused])

  const ring = focused
    ? {
        borderWidth: TV.focusBorder,
        borderColor: TV.colors.focusRing,
        shadowColor: TV.colors.focusGlow,
        shadowOpacity: 1,
        shadowRadius: TV.spacing(18),
        shadowOffset: { width: 0, height: 0 },
        transform: [{ scale: TV.focusScale }],
      }
    : {}

  const renderChildren =
    typeof children === 'function' ? children({ focused }) : children

  return (
    <Pressable
      ref={ref}
      disabled={disabled}
      onLayout={handleLayout}
      onPress={fire}
      onFocus={() => {
        setCurrent(id)
        remeasure()
      }}
      style={({ hovered }) => [
        style,
        { borderRadius: TV.radius.md, transform: [{ scale: 1 }] },
        focused || hovered ? ring : null,
        focused ? focusStyle : null,
      ]}
    >
      {renderChildren}
    </Pressable>
  )
}

export default Focusable
