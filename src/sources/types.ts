/**
 * 音源抽象层类型定义。
 * 接口形状对齐 lx-music 的 musicSdk 各音源模块
 * (musicSearch / getMusicUrl / getLyric / getSongList / getTopList)，
 * 这样 TV 版既能用内置 Mock 源离线演示，也能无缝切换到用户配置的真实音源服务。
 */

export type SourceId = 'kw' | 'kg' | 'mg' | 'tx' | 'wy' | 'mock' | 'http'

export interface MusicInfo {
  id: string
  source: SourceId
  name: string
  singer: string
  album: string
  /** 时长，字符串 "mm:ss" */
  interval?: string
  /** 封面图 URL（可为空，组件会渲染占位） */
  pic?: string
  /** 可用音质列表 */
  qualitys?: string[]
}

export interface MusicUrl {
  url: string
  quality: string
}

/** 海报/卡片（电视节目式浏览的基本单元） */
export interface PosterItem {
  id: string
  title: string
  subtitle?: string
  image?: string
  /** 卡片类型决定确认后的跳转行为 */
  type: 'song' | 'list' | 'singer' | 'category'
  /** 附带数据，如歌单 id、分类 key */
  payload?: any
}

/** 一"频道行"：电视首页的水平海报带 */
export interface ChannelRow {
  id: string
  title: string
  items: PosterItem[]
}

/** 音源需实现的统一接口 */
export interface MusicSource {
  id: SourceId
  name: string
  /** 是否为可配置的真实 HTTP 音源 */
  isRemote: boolean
  search(keyword: string, page?: number, limit?: number): Promise<MusicInfo[]>
  getMusicUrl(info: MusicInfo, quality?: string): Promise<MusicUrl>
  getLyric(info: MusicInfo): Promise<string>
  getSongList(listId: string): Promise<MusicInfo[]>
  getTopList(topId: string): Promise<MusicInfo[]>
  /** 电视首页的"频道行"数据 */
  getHomeChannels(): Promise<ChannelRow[]>
}
