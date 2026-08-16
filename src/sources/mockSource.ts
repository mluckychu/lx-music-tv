import { ChannelRow, MusicInfo, MusicSource, MusicUrl } from './types'
import { MOCK_CHANNELS, MOCK_SONGS } from '@/data/mockData'

/**
 * 内置 Mock 音源：离线即可演示完整 TV 交互（搜索/播放/歌词/歌单/排行榜）。
 * 封面留空，组件用渐变占位；音频 URL 返回空字符串，播放器会进入"演示播放"态
 * （进度条走动但不真正出声），便于在没有真实音源时验证整套遥控流程。
 */
export class MockSource implements MusicSource {
  id = 'mock' as const
  name = '内置演示源'
  isRemote = false

  async search(keyword: string, page = 1, limit = 30): Promise<MusicInfo[]> {
    const kw = keyword.trim().toLowerCase()
    const filtered = kw
      ? MOCK_SONGS.filter(
          (s) =>
            s.name.toLowerCase().includes(kw) ||
            s.singer.toLowerCase().includes(kw) ||
            s.album.toLowerCase().includes(kw),
        )
      : MOCK_SONGS
    const start = (page - 1) * limit
    return filtered.slice(start, start + limit)
  }

  async getMusicUrl(info: MusicInfo): Promise<MusicUrl> {
    // 演示源没有真实音频，返回空串，播放器据此进入演示态
    return { url: '', quality: info.qualitys?.[0] ?? '128k' }
  }

  async getLyric(_info: MusicInfo): Promise<string> {
    return '[00:00.00]（演示歌词）\n[00:04.00]这是洛雪音乐 TV 版\n[00:08.00]用方向键浏览，确认键播放\n[00:12.00]在设置中填入真实音源地址即可收听'
  }

  async getSongList(listId: string): Promise<MusicInfo[]> {
    // 简单按 listId 映射一组歌曲，足以演示歌单进入与播放
    const map: Record<string, string[]> = {
      pl_1: ['m1', 'm3', 'm4', 'm17', 'm10'],
      pl_2: ['m8', 'm9', 'm6', 'm7'],
      pl_3: ['m12', 'm13', 'm14'],
      pl_4: ['m15', 'm16', 'm19'],
      pl_5: ['m7', 'm14', 'm20'],
      pl_6: ['m8', 'm17', 'm20'],
    }
    const ids = map[listId] ?? MOCK_SONGS.map((s) => s.id)
    return MOCK_SONGS.filter((s) => ids.includes(s.id))
  }

  async getTopList(topId: string): Promise<MusicInfo[]> {
    // 排行榜：按 topId 返回不同排序（演示用，直接取部分歌曲）
    const order: Record<string, string[]> = {
      hot: ['m1', 'm17', 'm10', 'm8', 'm13'],
      new: ['m20', 'm19', 'm16', 'm15', 'm4'],
      original: ['m12', 'm14', 'm13', 'm6', 'm7'],
      network: ['m19', 'm20', 'm10', 'm1', 'm17'],
    }
    const ids = order[topId] ?? MOCK_SONGS.map((s) => s.id)
    return MOCK_SONGS.filter((s) => ids.includes(s.id))
  }

  async getHomeChannels(): Promise<ChannelRow[]> {
    return MOCK_CHANNELS
  }
}

export const mockSource = new MockSource()
