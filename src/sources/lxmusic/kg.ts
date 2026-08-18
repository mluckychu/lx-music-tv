/**
 * lx-music 真源码协议 —— 酷狗(kg) 音源（搜索 + 播放地址代理）
 * 复刻 kg musicSdk：songsearch.kugou.com/song_search_v2（无需签名）
 */
import { httpFetch } from './http'
import { decodeName, formatPlayTime, formatSingerName } from './codec'
import type { MusicInfo } from '../types'

export async function kgSearch(keyword: string, page = 1, limit = 30): Promise<MusicInfo[]> {
  const url =
    `https://songsearch.kugou.com/song_search_v2?keyword=${encodeURIComponent(keyword)}` +
    `&page=${page}&pagesize=${limit}&userid=0&clientver=&platform=WebFilter` +
    `&filter=2&iscorrection=1&privilege_filter=0&area_code=1`
  try {
    const { body } = await httpFetch(url, { timeout: 10000 })
    if (!body || body.error_code !== 0) return []
    const lists = body.data?.lists || []
    const out: MusicInfo[] = []
    const seen = new Set<string>()
    for (const it of lists) {
      const key = it.Audioid + (it.FileHash || '')
      if (seen.has(key)) continue
      seen.add(key)
      const qualitys: string[] = []
      if (it.FileSize) qualitys.push('128k')
      if (it.HQFileSize) qualitys.push('320k')
      if (it.SQFileSize) qualitys.push('flac')
      if (it.ResFileSize) qualitys.push('flac24bit')
      out.push({
        id: String(it.Audioid),
        source: 'kg',
        name: decodeName(it.SongName),
        singer: formatSingerName(it.Singers, 'name'),
        album: decodeName(it.AlbumName || ''),
        interval: formatPlayTime(parseInt(it.Duration, 10)),
        pic: undefined,
        qualitys: qualitys.length ? qualitys : ['128k'],
        hash: it.FileHash || undefined,
      })
      // 同组候选（Grp）
      for (const c of it.Grp || []) {
        const ck = c.Audioid + (c.FileHash || '')
        if (seen.has(ck)) continue
        seen.add(ck)
        const q2: string[] = []
        if (c.FileSize) q2.push('128k')
        if (c.HQFileSize) q2.push('320k')
        if (c.SQFileSize) q2.push('flac')
        if (c.ResFileSize) q2.push('flac24bit')
        out.push({
          id: String(c.Audioid),
          source: 'kg',
          name: decodeName(c.SongName),
          singer: formatSingerName(c.Singers, 'name'),
          album: decodeName(c.AlbumName || ''),
          interval: formatPlayTime(parseInt(c.Duration, 10)),
          pic: undefined,
          qualitys: q2.length ? q2 : ['128k'],
          hash: c.FileHash || undefined,
        })
      }
    }
    return out
  } catch {
    return []
  }
}
