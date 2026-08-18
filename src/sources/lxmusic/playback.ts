/**
 * 播放地址获取 —— 走 lx-music-api-server（洛雪官方推荐的「API 源」模式）
 * ----------------------------------------------------------------------------
 * 由于各音源（酷我/酷狗/咪咕）均启用了反爬/签名校验，且旧版公共代理
 * tm.tempmusics.tk 已停用（403），独立 App 无法直接拿到播放地址。
 *
 * 与洛雪桌面端一致，播放地址由「lx-music-api-server」统一提供：
 *   部署后通过环境变量 / 设置注入 BASE 与可选 AUTH 即可。
 *
 * 请求：GET {BASE}/url?server={source}&id={id}&type={quality}[&auth={AUTH}]
 * 响应：{ code: 0, data: { url } } 或 { url } 或纯字符串 URL
 *
 * 若不配置 BASE，getMusicUrl 会抛出明确的「未配置播放服务器」错误，
 * 浏览 / 搜索 / 歌词等功能不受影响。
 */
import type { MusicUrl } from '../types'

let API_BASE = ''
let API_AUTH = ''

/** 运行时配置播放服务器（建议在 App 启动时或设置页调用） */
export function configurePlayback(base: string, auth = ''): void {
  API_BASE = (base || '').replace(/\/+$/, '')
  API_AUTH = auth || ''
}

export function getPlaybackBase(): string {
  return API_BASE
}

export async function fetchMusicUrl(
  source: string,
  id: string,
  quality: string,
): Promise<MusicUrl> {
  if (!API_BASE) {
    throw new Error('未配置播放服务器（lx-music-api-server）。请在设置中填入服务器地址。')
  }
  const url =
    `${API_BASE}/url?server=${encodeURIComponent(source)}` +
    `&id=${encodeURIComponent(id)}&type=${encodeURIComponent(quality)}` +
    (API_AUTH ? `&auth=${encodeURIComponent(API_AUTH)}` : '')
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const text = await res.text()
    // 优先按 JSON 解析
    let json: any = null
    try {
      json = JSON.parse(text)
    } catch {
      /* not json */
    }
    let playUrl: string | null = null
    if (json) {
      playUrl = json?.data?.url ?? json?.url ?? null
    } else if (/^https?:\/\//.test(text.trim())) {
      playUrl = text.trim()
    }
    if (!playUrl) throw new Error(`播放服务器返回异常：${text.slice(0, 120)}`)
    return { url: playUrl, quality }
  } catch (e: any) {
    throw new Error(e?.message || '获取播放地址失败')
  }
}
