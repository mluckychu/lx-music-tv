import { MusicSource } from './types'
import { MockSource, mockSource } from './mockSource'
import { HttpSource } from './httpSource'

/**
 * 音源管理器：全局单例。
 * 默认使用内置 Mock 源（离线可演示）；在「设置」中填入真实音源地址后，
 * 自动切换为 HttpSource，播放真实音乐。
 */
class SourceManager {
  private http: HttpSource | null = null
  private active: MusicSource = mockSource

  getActive(): MusicSource {
    return this.active
  }

  get isRemote(): boolean {
    return this.active.isRemote
  }

  /** 配置真实音源地址（来自设置页） */
  setRemoteSource(baseUrl: string, sourceTag = 'kw') {
    this.http = new HttpSource({ baseUrl, sourceTag })
    this.active = this.http
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
