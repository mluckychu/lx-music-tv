/**
 * lx-music 真源码协议 —— 网易(wy / 云音乐) 音源
 * ----------------------------------------------------------------------------
 * 复刻 lyswhut/lx-music-desktop 的 wy musicSdk，使用 eapi 协议（AES-128-ECB）：
 *  - 搜索       /api/search/song/list/page
 *  - 排行榜     /api/v3/playlist/detail + /api/v3/song/detail（避开 weapi 的 RSA）
 *  - 歌词       /api/song/lyric/v1（标准 LRC 直取）
 *  - 签名/加解密 纯 JS：eapi = AES-128-ECB(eapiKey, PKCS7) hex 大写；复用 wbd 的 ECB 内核
 * 不引入 weapi 所需的 node RSA（公钥加密），改用 eapi 等价端点，保证纯 JS 可跑。
 */
import { httpFetch } from './http'
import { formatPlayTime, md5 } from './codec'
import { aes128ecbEncrypt, aes128ecbDecrypt, pkcs7Pad, pkcs7Unpad } from './wbd'
import { Buffer as RnBuffer } from 'buffer'
import type { MusicInfo } from '../types'

const Buffer: any = RnBuffer
const EAPI_KEY = 'e82ckenh8dichen8'
const EAPI_SALT = '-36cd479b6b5-'
const BATCH = 'https://interface.music.163.com/eapi/batch'
const LYRIC_EP = 'https://interface3.music.163.com/eapi/song/lyric/v1'

function eapiEncrypt(url: string, object: any): string {
  const text = typeof object === 'object' ? JSON.stringify(object) : object
  const message = `nobody${url}use${text}md5forencrypt`
  const digest = md5(message)
  const data = `${url}${EAPI_SALT}${text}${EAPI_SALT}${digest}`
  const dataBytes = new Uint8Array(Buffer.from(data, 'utf8'))
  const keyBytes = new Uint8Array(Buffer.from(EAPI_KEY, 'utf8'))
  const enc = aes128ecbEncrypt(pkcs7Pad(dataBytes), keyBytes)
  return Buffer.from(enc).toString('hex').toUpperCase()
}

function eapiDecrypt(hexStr: string): string {
  const ct = new Uint8Array(Buffer.from(hexStr, 'hex'))
  const keyBytes = new Uint8Array(Buffer.from(EAPI_KEY, 'utf8'))
  const dec = aes128ecbDecrypt(ct, keyBytes)
  return Buffer.from(pkcs7Unpad(dec)).toString('utf8')
}

async function eapiRequest(endpoint: string, logicalUrl: string, data: any): Promise<any> {
  const { body } = await httpFetch(endpoint, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
      origin: 'https://music.163.com',
    },
    form: { params: eapiEncrypt(logicalUrl, data) },
    timeout: 10000,
  })
  const text = (typeof body === 'string' ? body : JSON.stringify(body)).trim()
  // 部分 eapi 端点直接返回明文 JSON，部分返回 eapi 密文；先尝试解密，失败再直接解析 JSON。
  try {
    return JSON.parse(eapiDecrypt(text))
  } catch {
    try {
      return JSON.parse(text)
    } catch {
      return {}
    }
  }
}

// --------------------------- 通用映射 --------------------------------------
function mapSong(s: any): MusicInfo | null {
  const id = String(s?.id ?? '')
  if (!id || id === 'undefined') return null
  const types: string[] = []
  const priv = s?.privilege
  const maxBr = priv?.maxbr
  const maxLevel = priv?.maxBrLevel
  if (maxLevel === 'hires' || s?.hr) types.push('flac24bit')
  if (maxBr === 999000 || s?.sq) types.push('flac')
  if (maxBr === 320000 || s?.h) types.push('320k')
  types.push('128k')
  return {
    id,
    source: 'wy',
    name: s?.name ?? '',
    singer: Array.isArray(s?.ar) ? s.ar.map((a: any) => a.name).join('、') : (s?.ar?.[0]?.name ?? ''),
    album: s?.al?.name ?? '',
    interval: formatPlayTime((s?.dt ?? 0) / 1000),
    pic: s?.al?.picUrl ?? undefined,
    qualitys: types,
  }
}

// --------------------------- 搜索 -------------------------------------------
export async function wySearch(keyword: string, page = 1, limit = 30): Promise<MusicInfo[]> {
  try {
    const data = {
      keyword, needCorrect: '1', channel: 'typing',
      offset: limit * (page - 1), scene: 'normal', total: page === 1, limit,
    }
    const json = await eapiRequest(BATCH, '/api/search/song/list/page', data)
    if (json?.code !== 200) return []
    const resources = json?.data?.resources ?? []
    const out: MusicInfo[] = []
    for (const r of resources) {
      const s = r?.baseInfo?.simpleSongData
      if (s) {
        const m = mapSong(s)
        if (m) out.push(m)
      }
    }
    return out
  } catch {
    return []
  }
}

// --------------------------- 排行榜 -----------------------------------------
export const WY_BOARDS: { id: string; name: string; bangid: string }[] = [
  { id: 'wybsb', name: '飙升榜', bangid: '19723756' },
  { id: 'wyrgb', name: '热歌榜', bangid: '3778678' },
  { id: 'wyxgb', name: '新歌榜', bangid: '3779629' },
  { id: 'wyycb', name: '原创榜', bangid: '2884035' },
  { id: 'wygdb', name: '古典榜', bangid: '71384707' },
  { id: 'wydouyb', name: '抖音榜', bangid: '2250011882' },
  { id: 'wyhyb', name: '韩语榜', bangid: '745956260' },
  { id: 'wydianyb', name: '电音榜', bangid: '1978921795' },
  { id: 'wydjb', name: '电竞榜', bangid: '2006508653' },
  { id: 'wyktvbb', name: 'KTV唛榜', bangid: '21845217' },
]

export async function wyGetBoards(): Promise<{ id: string; name: string; bangid: string }[]> {
  return WY_BOARDS
}

export async function wyGetList(bangid: string, page = 1): Promise<MusicInfo[]> {
  try {
    const detail = await eapiRequest(BATCH, '/api/v3/playlist/detail', { id: Number(bangid), n: 100000, s: 8 })
    if (detail?.code !== 200) return []
    const ids: number[] = (detail?.playlist?.trackIds ?? []).map((t: any) => t.id).slice(0, 1000)
    if (!ids.length) return []
    const songDetail = await eapiRequest(BATCH, '/api/v3/song/detail', { c: JSON.stringify(ids.map((id) => ({ id }))) })
    const songs: any[] = songDetail?.songs ?? []
    return songs.map(mapSong).filter(Boolean) as MusicInfo[]
  } catch {
    return []
  }
}

// --------------------------- 歌词 -------------------------------------------
export async function wyGetLyric(songmid: string): Promise<string> {
  try {
    const json = await eapiRequest(LYRIC_EP, '/api/song/lyric/v1', {
      id: songmid, cp: false, tv: 0, lv: 0, rv: 0, kv: 0, yv: 0, ytv: 0, yrv: 0,
    })
    if (!json?.lrc?.lyric) return '[00:00.00]（暂无歌词）'
    let lrc = json.lrc.lyric
    if (json?.tlyric?.lyric) lrc += `\n[翻译]\n${json.tlyric.lyric}`
    return lrc
  } catch {
    return '[00:00.00]（暂无歌词）'
  }
}
