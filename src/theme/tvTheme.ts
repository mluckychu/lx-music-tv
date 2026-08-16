import { Dimensions } from 'react-native'

/**
 * 大屏设计令牌 (TV Theme)
 * ---------------------------------
 * 设计基准：1920 x 1080 (FHD)。
 * 所有尺寸以 1920 宽为基准，按实际屏宽等比缩放 (scale)，
 * 因此在 2K(2560) / 4K(3840) 电视上字与图标会同步放大，始终适合远距离观看。
 *
 * 关键适配点：
 *  - 字号放大到移动端的 ~1.8~2.2 倍，正文不低于 26dp
 *  - 焦点态使用高对比描边 + 外发光，远距离也能看清当前选中项
 *  - 间距宽松，避免大屏上元素挤在一起
 */

export interface TVTheme {
  scale: number
  /** 以 1920 为基准的屏幕宽高 */
  baseWidth: number
  baseHeight: number
  colors: {
    bg: string
    bgElevated: string
    bgScrim: string
    surface: string
    surfaceHover: string
    primary: string
    primarySoft: string
    text: string
    textSecondary: string
    textMuted: string
    focusRing: string
    focusGlow: string
    divider: string
    upNext: string
  }
  fontSize: {
    display: number
    title: number
    heading: number
    body: number
    caption: number
    small: number
  }
  radius: {
    sm: number
    md: number
    lg: number
    xl: number
  }
  spacing: (n: number) => number
  /** 焦点态描边宽度 */
  focusBorder: number
  /** 焦点态放大倍率 */
  focusScale: number
  /** 海报卡片尺寸 */
  poster: { width: number; height: number; gap: number }
  /** 列表行高 */
  rowHeight: number
}

const BASE_WIDTH = 1920
const BASE_HEIGHT = 1080

function buildTheme(scale: number): TVTheme {
  const s = (n: number) => Math.round(n * scale)
  return {
    scale,
    baseWidth: BASE_WIDTH,
    baseHeight: BASE_HEIGHT,
    colors: {
      bg: '#0b0d12',
      bgElevated: '#141821',
      bgScrim: 'rgba(0,0,0,0.72)',
      surface: '#1b2030',
      surfaceHover: '#232a3d',
      primary: '#ff4d6d',
      primarySoft: 'rgba(255,77,109,0.18)',
      text: '#f5f7fa',
      textSecondary: '#c2c9d6',
      textMuted: '#7c8699',
      focusRing: '#ffd54a',
      focusGlow: 'rgba(255,213,74,0.55)',
      divider: 'rgba(255,255,255,0.08)',
      upNext: '#3a86ff',
    },
    fontSize: {
      display: s(64),
      title: s(46),
      heading: s(34),
      body: s(28),
      caption: s(23),
      small: s(19),
    },
    radius: {
      sm: s(10),
      md: s(16),
      lg: s(24),
      xl: s(36),
    },
    spacing: (n: number) => s(n),
    focusBorder: Math.max(3, s(4)),
    focusScale: 1.12,
    poster: {
      width: s(240),
      height: s(240),
      gap: s(28),
    },
    rowHeight: s(96),
  }
}

let cached: TVTheme | null = null

/** 取当前主题。TV 启动时屏宽已知，按实际宽度缩放。 */
export function getTVTheme(): TVTheme {
  if (cached) return cached
  const { width } = Dimensions.get('window')
  const scale = Math.max(1, width / BASE_WIDTH)
  cached = buildTheme(scale)
  return cached
}

export const TV = getTVTheme()
