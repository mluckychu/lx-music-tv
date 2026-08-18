import { MusicSource } from './types'
import { MockSource, mockSource } from './mockSource'
import { LxMusicSource } from './lxmusic'

export { configurePlayback } from './lxmusic'

/**
 * 音源管理器：全局单例。
 * 默认使用洛雪(lx-music)真源码协议音源（酷我），搜索/排行榜/歌词直连各音源官方接口；
 * 播放地址由「lx-music-api-server」统一提供（见 SettingsScreen 配置），该模式与洛雪桌面端一致。
 * 也可在「设置」中切换音源标识(kw/kg/mg)与音质；保留内置演示源(离线)用于无网演示。
 */
class SourceManager {
  private active: MusicSource = new LxMusicSource('kw')

  getActive(): MusicSource {
    return this.active
  }

  get isRemote(): boolean {
    return this.active !== mockSource
  }

  /** 切换到洛雪真源码音源（按标识 kw/kg/mg/tx/wy） */
  setLxSource(tag: string) {
    this.active = new LxMusicSource(tag)
  }

  useMock() {
    this.active = mockSource
  }

  get usingMock(): boolean {
    return this.active instanceof MockSource
  }
}

export const sourceManager = new SourceManager()
export type { MusicSource }
