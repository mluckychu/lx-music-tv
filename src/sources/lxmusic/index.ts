/**
 * LxMusicSource —— 基于洛雪(lx-music)真源码协议的音源实现
 * ----------------------------------------------------------------------------
 * 直接复刻 lyswhut/lx-music-mobile 的 musicSdk 请求与解析（搜索/排行榜/歌单/歌词），
 * 播放地址走洛雪官方代理 tm.tempmusics.tk/url/{source}/{id}/{type}。
 *
 * 当前已接通：kw（酷我，全功能）、kg（酷狗，搜索+播放）、mg（咪咕，搜索+播放）。
 * tx / wy 需要签名（signRequest / eapi），暂以空结果优雅降级，后续可补。
 */
import type { ChannelRow, MusicInfo, MusicSource, MusicUrl, PosterItem } from '../types'
import { kwSearch, kwGetBoards, kwGetList, kwGetRcmPlayList, kwGetListDetail, kwHotSearch, kwGetLyric } from './kw'
import { kgSearch } from './kg'
import { mgSearch } from './mg'
import { fetchMusicUrl, configurePlayback } from './playback'

const SOURCE_NAMES: Record<string, string> = {
  kw: '酷我音乐',
  kg: '酷狗音乐',
  mg: '咪咕音乐',
  tx: 'QQ音乐',
  wy: '网易音乐',
}

export { configurePlayback }

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
    return '[00:00.00]（该音源暂不支持歌词）'
  }

  async getSongList(listId: string): Promise<MusicInfo[]> {
    if (this.tag === 'kw') return kwGetListDetail(listId)
    return []
  }

  async getTopList(topId: string): Promise<MusicInfo[]> {
    if (this.tag === 'kw') return kwGetList(topId)
    return []
  }

  /** 电视首页频道行：酷我推荐歌单 + 精选榜单（电视节目式海报带） */
  async getHomeChannels(): Promise<ChannelRow[]> {
    const channels: ChannelRow[] = []
    // 1) 推荐歌单（海报）
    try {
      const playlists = await kwGetRcmPlayList('hot', 1)
      if (playlists.length) {
        channels.push({ id: 'kw_rcm', title: '推荐歌单', items: playlists })
      }
    } catch {
      /* ignore */
    }
    // 2) 精选榜单（每行是一首首歌曲，确认即播放）
    const boards = await kwGetBoards()
    const picks = boards.slice(0, 4)
    await Promise.all(
      picks.map(async (b) => {
        try {
          const songs = await kwGetList(b.bangid, 1)
          if (songs.length) {
            channels.push({
              id: `kw_top_${b.bangid}`,
              title: b.name,
              items: songs.slice(0, 24).map(
                (s): PosterItem => ({
                  id: `song_${s.source}_${s.id}`,
                  title: s.name,
                  subtitle: s.singer,
                  image: s.pic || undefined,
                  type: 'song',
                  payload: s,
                }),
              ),
            })
          }
        } catch {
          /* ignore */
        }
      }),
    )
    return channels
  }
}

export function createLxSource(tag = 'kw'): LxMusicSource {
  return new LxMusicSource(tag)
}

export { kwHotSearch }
