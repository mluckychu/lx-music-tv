/**
 * lx-music 真源码协议 —— 腾讯(tx / QQ音乐) 音源
 * ----------------------------------------------------------------------------
 * 复刻 lyswhut/lx-music-desktop 的 tx musicSdk：
 *  - 搜索       musics.fcg + zzcSign 签名（纯 JS SHA1 实现）
 *  - 排行榜     musicu.fcg toplist GetDetail（无需签名）
 *  - 推荐歌单   musicu.fcg playlist.PlayListPlazaServer（电视节目式海报）
 *  - 歌单详情   fcg_ucc_getcdinfo_byids_cp.fcg
 *  - 歌词       暂走占位（tx 歌词需先取 songId，逻辑较重，后续补）
 * 所有请求仅依赖 RN fetch + 纯 JS 编解码，无原生模块。
 */
import { httpFetch } from './http'
import { decodeName, formatPlayTime, formatSingerName, sha1 } from './codec'
import { Buffer as RnBuffer } from 'buffer'
import type { MusicInfo } from '../types'

const Buffer: any = RnBuffer

// --------------------------- zzcSign 签名 ----------------------------------
const PART_1_INDEXES = [23, 14, 6, 36, 16, 40, 7, 19]
const PART_2_INDEXES = [16, 1, 32, 12, 19, 27, 8, 5]
const SCRAMBLE_VALUES = [89, 39, 179, 150, 218, 82, 58, 252, 177, 52, 186, 123, 120, 64, 242, 133, 143, 161, 121, 179]

function zzcSign(text: string): string {
  const hash = sha1(text)
  const part1 = PART_1_INDEXES.map((i) => hash[i]).join('')
  const part2 = PART_2_INDEXES.map((i) => hash[i]).join('')
  const part3 = SCRAMBLE_VALUES.map((value, i) => value ^ parseInt(hash.slice(i * 2, i * 2 + 2), 16))
  // part3 转 base64 并去掉 / + =（与 lx-music 一致）
  let b64 = ''
  try {
    b64 = Buffer.from(Uint8Array.from(part3)).toString('base64').replace(/[\/+=]/g, '')
  } catch {
    // RN 环境若 Buffer 不可用，用 btoa 兜底
    let bin = ''
    for (const b of part3) bin += String.fromCharCode(b)
    b64 = (typeof btoa !== 'undefined' ? btoa(bin) : '').replace(/[\/+=]/g, '')
  }
  return `zzc${part1}${b64}${part2}`.toLowerCase()
}

// --------------------------- 通用映射 --------------------------------------
const TX_IMG = 'https://y.gtimg.cn/music/photo_new'

function txImg(item: any): string {
  const albumMid = item?.album?.mid ?? ''
  if (!albumMid || albumMid === '空') {
    const singerMid = item?.singer?.[0]?.mid
    return singerMid ? `${TX_IMG}/T001R500x500M000${singerMid}.jpg` : ''
  }
  return `${TX_IMG}/T002R500x500M000${albumMid}.jpg`
}

function parseTypes(file: any): string[] {
  const types: string[] = []
  if (file?.size_128mp3) types.push('128k')
  if (file?.size_320mp3) types.push('320k')
  if (file?.size_flac) types.push('flac')
  if (file?.size_hires) types.push('flac24bit')
  return types
}

function mapSong(item: any): MusicInfo | null {
  const songmid = String(item?.mid ?? '')
  if (!songmid) return null
  const file = item?.file ?? {}
  const types = parseTypes(file)
  return {
    id: songmid,
    source: 'tx',
    name: decodeName(item?.title ?? ''),
    singer: formatSingerName(item?.singer ?? [], 'name'),
    album: decodeName(item?.album?.name ?? ''),
    interval: formatPlayTime(item?.interval ?? 0),
    pic: txImg(item) || undefined,
    qualitys: types.length ? types : ['128k'],
  }
}

// --------------------------- 搜索 -------------------------------------------
export async function txSearch(keyword: string, page = 1, limit = 30): Promise<MusicInfo[]> {
  const data = {
    comm: {
      ct: '11', cv: '14090508', v: '14090508', tmeAppID: 'qqmusic', phonetype: 'EBG-AN10',
      deviceScore: '553.47', devicelevel: '50', newdevicelevel: '20', rom: 'HuaWei/EMOTION/EmotionUI_14.2.0',
      os_ver: '12', OpenUDID: '0', OpenUDID2: '0', QIMEI36: '0', udid: '0', chid: '0', aid: '0',
      oaid: '0', taid: '0', tid: '0', wid: '0', uid: '0', sid: '0', modeSwitch: '6', teenMode: '0',
      ui_mode: '2', nettype: '1020', v4ip: '',
    },
    req: {
      module: 'music.search.SearchCgiService',
      method: 'DoSearchForQQMusicMobile',
      param: {
        search_type: 0, searchid: Math.random().toString().slice(2), query: keyword,
        page_num: page, num_per_page: limit, highlight: 0, nqc_flag: 0,
        multi_zhida: 0, cat: 2, grp: 1, sin: 0, sem: 0,
      },
    },
  }
  try {
    const sign = zzcSign(JSON.stringify(data))
    const url = `https://u.y.qq.com/cgi-bin/musics.fcg?sign=${sign}`
    const { body } = await httpFetch(url, {
      method: 'POST',
      headers: { 'User-Agent': 'QQMusic 14090508(android 12)' },
      body: JSON.stringify(data),
      timeout: 10000,
    })
    const inner = body?.req?.data
    const list = inner?.body?.item_song
    if (!Array.isArray(list)) return []
    return list.map(mapSong).filter(Boolean) as MusicInfo[]
  } catch {
    return []
  }
}

// --------------------------- 排行榜 -----------------------------------------
// 精选榜单（用于电视首页频道行 / 排行榜页）
export const TX_BOARDS: { id: string; name: string; bangid: string }[] = [
  { id: 'txlxzsb', name: '流行榜', bangid: '4' },
  { id: 'txrgb', name: '热歌榜', bangid: '26' },
  { id: 'txwlhgb', name: '网络榜', bangid: '28' },
  { id: 'txdyb', name: '抖音榜', bangid: '60' },
  { id: 'txndb', name: '内地榜', bangid: '5' },
  { id: 'txxgb', name: '香港榜', bangid: '59' },
  { id: 'txtwb', name: '台湾榜', bangid: '61' },
  { id: 'txoumb', name: '欧美榜', bangid: '3' },
  { id: 'txhgb', name: '韩国榜', bangid: '16' },
  { id: 'txrbb', name: '日本榜', bangid: '17' },
]

export async function txGetBoards(): Promise<{ id: string; name: string; bangid: string }[]> {
  return TX_BOARDS
}

export async function txGetList(bangid: string, page = 1): Promise<MusicInfo[]> {
  const body = {
    toplist: {
      module: 'musicToplist.ToplistInfoServer',
      method: 'GetDetail',
      param: { topid: Number(bangid), num: 300, period: '' },
    },
    comm: { uin: 0, format: 'json', ct: 20, cv: 1859 },
  }
  try {
    const { body: resp } = await httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
      method: 'POST',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)' },
      body: JSON.stringify(body),
      timeout: 10000,
    })
    const songInfoList = resp?.toplist?.data?.songInfoList
    if (!Array.isArray(songInfoList)) return []
    return songInfoList.map(mapSong).filter(Boolean) as MusicInfo[]
  } catch {
    return []
  }
}

// --------------------------- 推荐歌单（海报） -------------------------------
export interface TxPlayList {
  id: string
  name: string
  author: string
  img: string
  total: number
}

export async function txGetRcmPlayList(sortId = 5, page = 1): Promise<TxPlayList[]> {
  const data = {
    comm: { cv: 1602, ct: 20 },
    playlist: {
      method: 'get_playlist_by_tag',
      param: { id: 10000000, sin: 36 * (page - 1), size: 36, order: sortId, cur_page: page },
      module: 'playlist.PlayListPlazaServer',
    },
  }
  const url =
    'https://u.y.qq.com/cgi-bin/musicu.fcg?loginUin=0&hostUin=0&format=json&inCharset=utf-8' +
    `&outCharset=utf-8&notice=0&platform=wk_v15.json&needNewCode=0&data=${encodeURIComponent(JSON.stringify(data))}`
  try {
    const { body } = await httpFetch(url, { headers: { Referer: 'https://y.qq.com' }, timeout: 10000 })
    const list = body?.playlist?.data?.v_playlist
    if (!Array.isArray(list)) return []
    return list.map((it: any): TxPlayList => ({
      id: String(it.tid),
      name: decodeName(it.title),
      author: it.creator_info?.nick ?? '',
      img: it.cover_url_medium ?? '',
      total: it.song_ids?.length ?? 0,
    }))
  } catch {
    return []
  }
}

// --------------------------- 歌单详情（歌曲） -------------------------------
export async function txGetListDetail(listId: string): Promise<MusicInfo[]> {
  const url =
    `https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1` +
    `&onlysong=0&new_format=1&disstid=${listId}&loginUin=0&hostUin=0&format=json&inCharset=utf8` +
    `&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0`
  try {
    const { body } = await httpFetch(url, {
      headers: { Origin: 'https://y.qq.com', Referer: `https://y.qq.com/n/yqq/playsquare/${listId}.html` },
      timeout: 10000,
    })
    const songlist = body?.cdlist?.[0]?.songlist
    if (!Array.isArray(songlist)) return []
    return songlist.map(mapSong).filter(Boolean) as MusicInfo[]
  } catch {
    return []
  }
}
