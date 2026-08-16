import React, { useEffect } from 'react'
import { useFocus } from './FocusContext'
import { Direction } from './spatialNav'

interface RemoteHandlerProps {
  /** 返回键（菜单键）回调，用于页面回退 */
  onMenu?: () => void
  /** 播放/暂停媒体键 */
  onPlayPause?: () => void
  /** 是否启用方向导航（在文本输入框聚焦时可临时关闭） */
  enabled?: boolean
}

/**
 * 遥控器事件监听：把电视遥控的 上/下/左/右/确认/菜单/播放暂停
 * 映射到焦点移动与动作。基于 react-native-tvos 的 TVEventHandler
 * （Android TV 的 DPAD 会被自动映射为这些事件类型）。
 */
export function RemoteHandler({ onMenu, onPlayPause, enabled = true }: RemoteHandlerProps) {
  const { move, activate } = useFocus()

  useEffect(() => {
    // react-native-tvos 在 'react-native' 上导出 TVEventHandler
    const RN: any = require('react-native')
    const TVEventHandler: any = RN.TVEventHandler
    if (!TVEventHandler) return

    const handler = new TVEventHandler()
    handler.enable(null, (_cmp: any, evt: { eventType: string }) => {
      if (!enabled) return
      const t = evt?.eventType
      let dir: Direction | null = null
      switch (t) {
        case 'up':
          dir = 'up'
          break
        case 'down':
          dir = 'down'
          break
        case 'left':
          dir = 'left'
          break
        case 'right':
          dir = 'right'
          break
        case 'select':
        case 'enter':
          activate()
          return
        case 'menu':
        case 'back':
          onMenu?.()
          return
        case 'playPause':
          onPlayPause?.()
          return
      }
      if (dir) {
        const moved = move(dir)
        if (!moved) {
          // 边界处可在此触发容器滚动等，目前保持焦点不动
        }
      }
    })

    return () => {
      handler.disable()
    }
  }, [move, activate, onMenu, onPlayPause, enabled])

  return null
}

export default RemoteHandler
