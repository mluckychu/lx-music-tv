/**
 * lx-music 真源码协议 —— 酷我(kw) 音源
 * ----------------------------------------------------------------------------
 * 复刻 lyswhut/lx-music-mobile 的 kw musicSdk 真实请求与解析：
 *  - 搜索     musicSearch.js  (search.kuwo.cn/r.s)
 *  - 排行榜   leaderboard.js  (wbd.kuwo.cn/api/bd/bang/bang_info，走 wbdCrypto 签名)
 *  - 推荐歌单 songList.js     (wapi.kuwo.cn getRcmPlayList)
 *  - 歌单详情 songList.js     (nplserver.kuwo.cn/pl.svc getlistinfo)
 *  - 热搜     hotSearch.js
 *  - 歌词     lyric.js        (newlyric.kuwo.cn + XOR 加密 + inflate + GBK)
 *  - 播放地址 统一由 playback.ts（lx-music-api-server）提供，见 configurePlayback。
 */
import { httpFetch } from './http'
import { decodeName, formatPlayTime, formatSinger, objStr2JSON } from './codec'
import { wbdCrypto } from './wbd'
import type { MusicInfo, PosterItem } from '../types'
import { inflate } from 'pako'
import iconv from 'iconv-lite'

const Buffer: any = (globalThis as any).Buffer

// 音质比特映射（与 lx-music N_MINFO 对齐）
function parseTypes(nMinfo?: string): { types: string[]; qualitys: string[] } {
  const reg = /level:(\w+),bitrate:(\d+),format:(\w+),size:([\w.]+)/g
  const types: string[] = []
  if (!nMinfo) return { types, qualitys: [] }
  let m: RegExpExecArray | null
  const seen = new Set<string>()
  while ((m = reg.exec(nMinfo))) {
    const bit = m[2]
    let type = ''
    switch (bit) {
      case '4000': type = 'flac24bit'; break
      case '2000': type = 'flac'; break
      case '320': type = '320k'; break
      case '128': type = '128k'; break
      default: continue
    }
    if (seen.has(type)) continue
    seen.add(type)
    types.push(type)
  }
  // 高音质在前
  const order = ['flac24bit', 'flac', '320k', '128k']
  types.sort((a, b) => order.indexOf(a) - order.indexOf(b))
  return { types, qualitys: types }
}

// --------------------------- 搜索 ------------------------------------------
export async function kwSearch(keyword: string, page = 1, limit = 30): Promise<MusicInfo[]> {
  const url =
    `http://search.kuwo.cn/r.s?client=kt&all=${encodeURIComponent(keyword)}` +
    `&pn=${page - 1}&rn=${limit}&uid=794762570&ver=kwplayer_ar_9.2.2.1&vipver=1` +
    `&show_copyright_off=1&newver=1&ft=music&cluster=0&strategy=2012&encoding=utf8` +
    `&rformat=json&vermerge=1&mobi=1&issubtitle=1`
  const { body } = await httpFetch(url)
  const abslist = body?.abslist || []
  const list: MusicInfo[] = []
  for (const info of abslist) {
    const songmid = String(info.MUSICRID || '').replace('MUSIC_', '')
    if (!songmid) continue
    const { qualitys } = parseTypes(info.N_MINFO)
    list.push({
      id: songmid,
      source: 'kw',
      name: decodeName(info.SONGNAME),
      singer: formatSinger(decodeName(info.ARTIST)),
      album: info.ALBUM ? decodeName(info.ALBUM) : '',
      interval: formatPlayTime(parseInt(info.DURATION, 10)),
      pic: undefined,
      qualitys: qualitys.length ? qualitys : ['128k', '320k'],
    })
  }
  return list
}

// --------------------------- 排行榜 ----------------------------------------
export interface KwBoard {
  id: string
  name: string
  bangid: string
}

// 与 lx-music leaderboard.js boardList 一致的精选榜单（静态，无需网络）
export const KW_BOARDS: KwBoard[] = [
  { id: 'kw__93', name: '飙升榜', bangid: '93' },
  { id: 'kw__17', name: '新歌榜', bangid: '17' },
  { id: 'kw__16', name: '热歌榜', bangid: '16' },
  { id: 'kw__158', name: '抖音热歌榜', bangid: '158' },
  { id: 'kw__26', name: '经典怀旧榜', bangid: '26' },
  { id: 'kw__104', name: '华语榜', bangid: '104' },
  { id: 'kw__182', name: '粤语榜', bangid: '182' },
  { id: 'kw__22', name: '欧美榜', bangid: '22' },
  { id: 'kw__184', name: '韩语榜', bangid: '184' },
  { id: 'kw__183', name: '日语榜', bangid: '183' },
  { id: 'kw__64', name: '影视金曲榜', bangid: '64' },
  { id: 'kw__145', name: '会员畅听榜', bangid: '145' },
]

export async function kwGetBoards(): Promise<KwBoard[]> {
  return KW_BOARDS
}

export async function kwGetList(bangid: string, page = 1): Promise<MusicInfo[]> {
  const requestBody = {
    uid: '',
    devId: '',
    sFrom: 'kuwo_sdk',
    user_type: 'AP',
    carSource: 'kwplayercar_ar_6.0.1.0_apk_keluze.apk',
    id: Number(bangid),
    pn: page - 1,
    rn: 100,
  }
  const url = `https://wbd.kuwo.cn/api/bd/bang/bang_info?${wbdCrypto.buildParam(requestBody)}`
  try {
    const { body } = await httpFetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    })
    const rawData = wbdCrypto.decodeData(body)
    const data = rawData?.data
    if (rawData?.code != 200 || !data?.musiclist) return []
    return (data.musiclist as any[])
      .map((it: any): MusicInfo | null => {
        const songmid = String(it.id ?? '')
        if (!songmid) return null
        const { qualitys } = parseTypes(it.n_minfo || it.N_MINFO)
        return {
          id: songmid,
          source: 'kw',
          name: decodeName(it.name),
          singer: formatSinger(decodeName(it.artist)),
          album: it.album ? decodeName(it.album) : '',
          interval: formatPlayTime(parseInt(it.duration ?? 0, 10)),
          pic: it.pic || null,
          qualitys: qualitys.length ? qualitys : ['128k', '320k'],
        }
      })
      .filter(Boolean) as MusicInfo[]
  } catch {
    return []
  }
}

// --------------------------- 推荐歌单（海报行） -----------------------------
export async function kwGetRcmPlayList(sort = 'hot', page = 1): Promise<PosterItem[]> {
  const url =
    `http://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList` +
    `?loginUid=0&loginSid=0&appUid=76039576&pn=${page}&rn=36&order=${sort}`
  try {
    const { body } = await httpFetch(url, { timeout: 10000 })
    const data = body?.data?.data || []
    if (!Array.isArray(data)) return []
    return data.map((it: any): PosterItem => ({
      id: `kwpl_${it.id}`,
      title: decodeName(it.name),
      subtitle: `${decodeName(it.uname)} · ${it.total || ''}首`,
      image: it.img || null,
      type: 'list',
      payload: { listId: String(it.id), source: 'kw' },
    }))
  } catch {
    return []
  }
}

// --------------------------- 歌单详情（歌曲列表） ---------------------------
export async function kwGetListDetail(listId: string, page = 1): Promise<MusicInfo[]> {
  const url =
    `http://nplserver.kuwo.cn/pl.svc?op=getlistinfo&pid=${listId}` +
    `&pn=${page - 1}&rn=1000&encode=utf8&keyset=pl2012&identity=kuwo&pcmp4=1` +
    `&vipver=MUSIC_9.0.5.0_W1&newver=1`
  try {
    const { body } = await httpFetch(url, { timeout: 10000 })
    const musiclist = body?.musiclist || []
    if (!Array.isArray(musiclist)) return []
    return musiclist
      .map((it: any): MusicInfo | null => {
        const songmid = String(it.id || '').replace('MUSIC_', '')
        if (!songmid) return null
        const { qualitys } = parseTypes(it.N_MINFO)
        return {
          id: songmid,
          source: 'kw',
          name: decodeName(it.name),
          singer: formatSinger(decodeName(it.artist)),
          album: it.album ? decodeName(it.album) : '',
          interval: formatPlayTime(parseInt(it.duration, 10)),
          pic: undefined,
          qualitys: qualitys.length ? qualitys : ['128k', '320k'],
        }
      })
      .filter(Boolean) as MusicInfo[]
  } catch {
    return []
  }
}

// --------------------------- 热搜 ------------------------------------------
export async function kwHotSearch(): Promise<string[]> {
  const url =
    `http://hotword.kuwo.cn/hotword.s?prod=kwplayer_ar_9.3.0.1&corp=kuwo&newver=2` +
    `&vipver=9.3.0.1&source=kwplayer_ar_9.3.0.1_40.apk&p2p=1&notrace=0&uid=0` +
    `&plat=kwplayer_ar&rformat=json&encoding=utf8&tabid=1`
  try {
    const { body } = await httpFetch(url, { timeout: 8000 })
    const arr = Array.isArray(body) ? body : body?.data || []
    return arr.map((it: any) => decodeName(it.key || it.name || it.word || it)).filter(Boolean).slice(0, 10)
  } catch {
    return []
  }
}

// --------------------------- 歌词（XOR + inflate + GBK） -------------------
const buf_key = Buffer ? Buffer.from('yeelion') : null
function buildParams(id: string, isGetLyricx: boolean): string {
  let params = `user=12345,web,web,web&requester=localhost&req=1&rid=MUSIC_${id}`
  if (isGetLyricx) params += '&lrcx=1'
  const buf_str = Buffer.from(params)
  const out = new Uint16Array(buf_str.length)
  let i = 0
  while (i < buf_str.length) {
    let j = 0
    while (j < buf_key.length && i < buf_str.length) {
      out[i] = buf_key[j] ^ buf_str[i]
      i++
      j++
    }
  }
  return Buffer.from(out).toString('base64')
}

function findHeaderEnd(buf: Uint8Array): number {
  for (let i = 0; i < buf.length - 3; i++) {
    if (buf[i] === 13 && buf[i + 1] === 10 && buf[i + 2] === 13 && buf[i + 3] === 10) return i + 4
  }
  return -1
}

async function decodeLyricBuffer(buf: Uint8Array, isGetLyricx: boolean): Promise<string> {
  const head = new TextDecoder().decode(buf.slice(0, 10))
  if (head !== 'tp=content') return ''
  const idx = findHeaderEnd(buf)
  if (idx < 0) return ''
  const inflated = inflate(buf.slice(idx))
  if (!isGetLyricx) return iconv.decode(inflated as any, 'gb18030')
  const b64 = Buffer.from(inflated).toString()
  const src = Buffer.from(b64)
  const out = new Uint16Array(src.length)
  let i = 0
  while (i < src.length) {
    let j = 0
    while (j < buf_key.length && i < src.length) {
      out[i] = buf_key[j] ^ src[i]
      i++
      j++
    }
  }
  return iconv.decode(Buffer.from(out) as any, 'gb18030')
}

function parseLrc(lrc: string): string {
  const lines = lrc.split(/\r\n|\r|\n/)
  const out: string[] = []
  let hasTime = false
  for (const line of lines) {
    const t = /\[\d{1,2}:\d{1,2}(\.\d{1,4})?\]/.test(line)
    if (t) {
      hasTime = true
      out.push(line)
    } else if (/\[(ti|ar|al|by|offset):/i.test(line)) {
      out.push(line)
    }
  }
  return hasTime ? out.join('\n') : ''
}

export async function kwGetLyric(songmid: string): Promise<string> {
  const url = `http://newlyric.kuwo.cn/newlyric.lrc?${buildParams(songmid, true)}`
  try {
    const { body } = await httpFetch(url, { binary: true, timeout: 10000 })
    const buf = body instanceof ArrayBuffer ? new Uint8Array(body) : new Uint8Array(body as any)
    const raw = await decodeLyricBuffer(buf, true)
    const parsed = parseLrc(raw)
    return parsed || '[00:00.00]（暂无歌词）'
  } catch {
    return '[00:00.00]（暂无歌词）'
  }
}

// --------------------------- 播放地址（由 playback.ts 提供） -----------------------
// 酷我播放地址需 secret / kw_token 反爬校验，且旧版公共代理 tm.tempmusics.tk 已停用，
// 故播放地址统一走 lx-music-api-server（见 playback.ts / configurePlayback）。

