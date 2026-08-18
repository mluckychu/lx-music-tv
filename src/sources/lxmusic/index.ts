/**
 * LxMusicSource —— 基于洛雪(lx-music)真源码协议的音源实现
 * ----------------------------------------------------------------------------
 * 直接复刻 lyswhut/lx-music 的 musicSdk 请求与解析（搜索/排行榜/歌单/歌词），
 * 播放地址走可配置的 lx-music-api-server。
 *
 * 已接通：
 *  - kw（酷我）：搜索/排行榜(wbd 签名)/推荐歌单/歌单详情/歌词 —— 全功能
 *  - tx（QQ音乐）：搜索(zzcSign)/排行榜/推荐歌单/歌单详情
 *  - wy（网易云）：搜索(eapi)/排行榜(eapi)/歌词(eapi)
 *  - kg（酷狗）/ mg（咪咕）：搜索 + 播放
 * tx/wy 的签名均用纯 JS 实现（AES-128-ECB / SHA1），无原生模块依赖。
 */
import type { ChannelRow, MusicInfo, MusicSource, MusicUrl, PosterItem } from '../types'
import { kwSearch, kwGetBoards, kwGetList, kwGetRcmPlayList, kwGetListDetail, kwHotSearch, kwGetLyric } from './kw'
import { kgSearch } from './kg'
import { mgSearch } from './mg'
import { txSearch, txGetBoards, txGetList, txGetRcmPlayList, txGetListDetail } from './tx'
import { wySearch, wyGetBoards, wyGetList, wyGetLyric } from './wy'
import { fetchMusicUrl, configurePlayback } from './playback'

const SOURCE_NAMES: Record<string, string> = {
  kw: '酷我音乐',
  kg: '酷狗音乐',
  mg: '咪咕音乐',
  tx: 'QQ音乐',
  wy: '网易云音乐',
}

export { configurePlayback }

function toSongPoster(s: MusicInfo): PosterItem {
  return {
    id: `song_${s.source}_${s.id}`,
    title: s.name,
    subtitle: s.singer,
    image: s.pic || undefined,
    type: 'song',
    payload: s,
  }
}

export class LxMusicSource implements MusicSource {
  id: any
  name: string
  isRemote = true
  private tag: string

  constructor(tag = 'kw') {
    this.tag = tag
    this.id = tag as any
    this.name = SOURCE_NAMES[tag] || tag
  }

  async search(keyword: string, page = 1, limit = 30): Promise<MusicInfo[]> {
    switch (this.tag) {
      case 'kw':
        return kwSearch(keyword, page, limit)
      case 'kg':
        return kgSearch(keyword, page, limit)
      case 'mg':
        return mgSearch(keyword, page, limit)
      case 'tx':
        return txSearch(keyword, page, limit)
      case 'wy':
        return wySearch(keyword, page, limit)
      default:
        return []
    }
  }

  async getMusicUrl(info: MusicInfo, quality = '128k'): Promise<MusicUrl> {
    // 酷狗需使用文件 hash 而非 audioid
    const id = this.tag === 'kg' && info.hash ? info.hash : info.id
    return fetchMusicUrl(this.tag, id, quality)
  }

  async getLyric(info: MusicInfo): Promise<string> {
    if (this.tag === 'kw') return kwGetLyric(info.id)
    if (this.tag === 'wy') return wyGetLyric(info.id)
    return '[00:00.00]（该音源暂不支持歌词）'
  }

  async getSongList(listId: string): Promise<MusicInfo[]> {
    if (this.tag === 'kw') return kwGetListDetail(listId)
    if (this.tag === 'tx') return txGetListDetail(listId)
    return []
  }

  async getTopList(topId: string): Promise<MusicInfo[]> {
    if (this.tag === 'kw') return kwGetList(topId)
    if (this.tag === 'tx') return txGetList(topId)
    if (this.tag === 'wy') return wyGetList(topId)
    return []
  }

  /** 电视首页频道行：当前音源的推荐歌单 + 精选榜单（电视节目式海报带） */
  async getHomeChannels(): Promise<ChannelRow[]> {
    const channels: ChannelRow[] = []
    try {
      if (this.tag === 'kw') {
        const playlists = await kwGetRcmPlayList('hot', 1)
        if (playlists.length) {
          channels.push({ id: 'kw_rcm', title: '推荐歌单', items: playlists })
        }
        const boards = await kwGetBoards()
        await this.pushBoardRows(channels, boards, (b) => kwGetList(b.bangid, 1))
      } else if (this.tag === 'tx') {
        const boards = await txGetBoards()
        await this.pushBoardRows(channels, boards, (b) => txGetList(b.bangid, 1))
        const rcm = await txGetRcmPlayList(5, 1)
        if (rcm.length) {
          channels.unshift({
            id: 'tx_rcm',
            title: '推荐歌单',
            items: rcm.map(
              (p): PosterItem => ({
                id: `list_tx_${p.id}`,
                title: p.name,
                subtitle: p.author,
                image: p.img || undefined,
                type: 'list',
                payload: p,
              }),
            ),
          })
        }
      } else if (this.tag === 'wy') {
        const boards = await wyGetBoards()
        await this.pushBoardRows(channels, boards, (b) => wyGetList(b.bangid, 1))
      }
    } catch {
      /* ignore */
    }
    return channels
  }

  private async pushBoardRows(
    channels: ChannelRow[],
    boards: { id: string; name: string; bangid: string }[],
    getSongs: (b: { id: string; name: string; bangid: string }) => Promise<MusicInfo[]>,
  ): Promise<void> {
    const picks = boards.slice(0, 4)
    await Promise.all(
      picks.map(async (b) => {
        try {
          const songs = await getSongs(b)
          if (songs.length) {
            channels.push({
              id: `${this.tag}_top_${b.bangid}`,
              title: b.name,
              items: songs.slice(0, 24).map(toSongPoster),
            })
          }
        } catch {
          /* ignore */
        }
      }),
    )
  }
}

export function createLxSource(tag = 'kw'): LxMusicSource {
  return new LxMusicSource(tag)
}

export { kwHotSearch }
