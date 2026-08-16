import { ChannelRow, MusicInfo, MusicSource, MusicUrl } from './types'

/**
 * 真实音源客户端（HTTP）。
 * ---------------------------------------------------------------
 * lx-music 的"音源"本质是一个返回音频链接的服务。TV 版通过本类把请求发往
 * 你在「设置」里填写的音源地址，从而播放真实音乐。请求/响应约定如下
 * （与社区常见 lx-music 兼容源服务一致，可据你的源服务做微调）：
 *
 *   GET {base}/search?keyword=&source=&limit=&page=
 *        -> { list: [ { id, name, singer, album, interval?, pic? } ] }
 *   GET {base}/musicUrl?id=&source=&quality=
 *        -> { url } | string
 *   GET {base}/lyric?id=&source=
 *        -> { lyric } | string
 *   GET {base}/songlist?id=&source=
 *        -> { list: [...] }
 *   GET {base}/toplist?source=&id=
 *        -> { list: [...] }
 *   GET {base}/home
 *        -> { channels: ChannelRow[] }   (可选；缺省时由排行榜拼出)
 *
 * 解析时兼容字段别名（name/songname、singer/songer 等），并兜底容错。
 */

export function buildUrl(base: string, path: string, params: Record<string, string | number> = {}): string {
  const trimmed = base.replace(/\/+$/, '')
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return qs ? `${trimmed}/${path}?${qs}` : `${trimmed}/${path}`
}

function pick<T = any>(obj: any, keys: string[]): T | undefined {
  for (const k of keys) if (obj?.[k] != null) return obj[k]
  return undefined
}

export function normalizeSong(raw: any): MusicInfo {
  const source = (raw.source as MusicInfo['source']) ?? 'http'
  return {
    id: String(raw.id ?? raw.songmid ?? raw.songId ?? ''),
    source,
    name: String(pick(raw, ['name', 'songname', 'title']) ?? '未知'),
    singer: String(pick(raw, ['singer', 'songer', 'artist', 'singers']) ?? '未知'),
    album: String(pick(raw, ['album', 'albumname', 'albumName']) ?? ''),
    interval: raw.interval != null ? String(raw.interval) : undefined,
    pic: pick(raw, ['pic', 'picUrl', 'image', 'img']) as string | undefined,
    qualitys: raw.qualitys ?? raw._qualitys,
  }
}

export function extractList(data: any): MusicInfo[] {
  if (Array.isArray(data)) return data.map(normalizeSong)
  const list = pick<any[]>(data, ['list', 'songs', 'data', 'result']) ?? []
  if (!Array.isArray(list)) return []
  return list.map(normalizeSong)
}

export interface HttpSourceOptions {
  baseUrl: string
  /** 音源标识，传给音源服务的 source 参数（如 kw/kg/mg/tx/wy） */
  sourceTag?: string
}

export class HttpSource implements MusicSource {
  id = 'http' as const
  name = '自定义音源'
  isRemote = true
  private baseUrl: string
  private sourceTag: string

  constructor(opts: HttpSourceOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '')
    this.sourceTag = opts.sourceTag ?? 'kw'
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '')
  }

  private async getJson(path: string, params: Record<string, string | number>): Promise<any> {
    const url = buildUrl(this.baseUrl, path, { source: this.sourceTag, ...params })
    const res = await fetch(url)
    if (!res.ok) throw new Error(`音源请求失败 ${res.status}: ${url}`)
    return res.json()
  }

  async search(keyword: string, page = 1, limit = 30): Promise<MusicInfo[]> {
    const data = await this.getJson('search', { keyword, page, limit })
    // search 响应可能是 { list } 或直接数组
    const arr = Array.isArray(data) ? data : extractList(data)
    return arr.map(normalizeSong)
  }

  async getMusicUrl(info: MusicInfo, quality = '128k'): Promise<MusicUrl> {
    const data = await this.getJson('musicUrl', { id: info.id, quality })
    const url = typeof data === 'string' ? data : pick<string>(data, ['url', 'playUrl', 'src'])
    if (!url) throw new Error('音源未返回音频地址')
    return { url, quality: pick<string>(data, ['quality', 'type']) ?? quality }
  }

  async getLyric(info: MusicInfo): Promise<string> {
    const data = await this.getJson('lyric', { id: info.id })
    const lyric = typeof data === 'string' ? data : pick<string>(data, ['lyric', 'lrc', 'txt'])
    return lyric ?? ''
  }

  async getSongList(listId: string): Promise<MusicInfo[]> {
    const data = await this.getJson('songlist', { id: listId })
    return extractList(data)
  }

  async getTopList(topId: string): Promise<MusicInfo[]> {
    const data = await this.getJson('toplist', { id: topId })
    return extractList(data)
  }

  async getHomeChannels(): Promise<ChannelRow[]> {
    try {
      const data = await this.getJson('home', {})
      if (Array.isArray(data?.channels)) return data.channels as ChannelRow[]
    } catch {
      // 源服务未提供 /home 时，回退用排行榜组装基础频道
    }
    const tops = ['hot', 'new', 'original', 'network']
    const items = tops.map((t) => ({
      id: `top_${t}`,
      title: { hot: '热歌榜', new: '新歌榜', original: '原创榜', network: '网络榜' }[t],
      subtitle: '排行榜',
      type: 'category' as const,
      payload: { topId: t },
    }))
    return [{ id: 'ch_top', title: '排行榜', items }]
  }
}
