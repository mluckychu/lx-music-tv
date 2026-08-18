/**
 * lx-music 真源码协议 —— 咪咕(mg) 音源（搜索 + 播放地址代理）
 * 复刻 mg musicSdk：jadeite.migu.cn 搜索需 MD5 签名（createSignature）
 */
import { httpFetch } from './http'
import { decodeName, formatPlayTime, formatSingerName, md5 } from './codec'
import type { MusicInfo, MusicUrl } from '../types'

const DEVICE_ID = '963B7AA0D21511ED807EE5846EC87D20'
const SIGN_MD5 = '6cdc72a439cef99a3418d2a78aa28c73'
const APP_KEY = 'yyapp2d16148780a1dcc7408e06336b98cfd50'

function createSignature(time: string, str: string): { sign: string; deviceId: string } {
  const sign = md5(`${str}${SIGN_MD5}${APP_KEY}${DEVICE_ID}${time}`)
  return { sign, deviceId: DEVICE_ID }
}

export async function mgSearch(keyword: string, page = 1, limit = 20): Promise<MusicInfo[]> {
  const time = Date.now().toString()
  const signData = createSignature(time, keyword)
  const url =
    `https://jadeite.migu.cn/music_search/v3/search/searchAll?isCorrect=0&isCopyright=1` +
    `&searchSwitch=%7B%22song%22%3A1%2C%22album%22%3A0%2C%22singer%22%3A0%2C%22tagSong%22%3A1` +
    `%2C%22mvSong%22%3A0%2C%22bestShow%22%3A1%2C%22songlist%22%3A0%2C%22lyricSong%22%3A0%7D` +
    `&pageSize=${limit}&text=${encodeURIComponent(keyword)}&pageNo=${page}&sort=0&sid=USS`
  try {
    const { body } = await httpFetch(url, {
      timeout: 10000,
      headers: {
        uiVersion: 'A_music_3.6.1',
        deviceId: signData.deviceId,
        timestamp: time,
        sign: signData.sign,
        channel: '0146921',
        'User-Agent':
          'Mozilla/5.0 (Linux; U; Android 11.0.0; zh-cn; MI 11 Build/OPR1.170623.032) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
      },
    })
    if (!body || body.code !== '000000') return []
    const songData = body.songResultData || { resultList: [], totalCount: 0 }
    const out: MusicInfo[] = []
    const seen = new Set<string>()
    for (const group of songData.resultList || []) {
      for (const it of group) {
        if (!it.songId || !it.copyrightId || seen.has(it.copyrightId)) continue
        seen.add(it.copyrightId)
        const qualitys: string[] = []
        for (const f of it.audioFormats || []) {
          switch (f.formatType) {
            case 'PQ': qualitys.push('128k'); break
            case 'HQ': qualitys.push('320k'); break
            case 'SQ': qualitys.push('flac'); break
            case 'ZQ24': qualitys.push('flac24bit'); break
          }
        }
        let img = it.img3 || it.img2 || it.img1 || null
        if (img && !/^https?:/.test(img)) img = 'http://d.musicapp.migu.cn' + img
        out.push({
          id: String(it.songId),
          source: 'mg',
          name: decodeName(it.name),
          singer: formatSingerName(it.singerList),
          album: decodeName(it.album || ''),
          interval: formatPlayTime(parseInt(it.duration, 10)),
          pic: img,
          qualitys: qualitys.length ? qualitys : ['128k'],
        })
      }
    }
    return out
  } catch {
    return []
  }
}

export async function mgGetMusicUrl(songId: string, quality = '128k'): Promise<MusicUrl> {
  // 播放地址统一由 playback.ts（lx-music-api-server）提供，见 configurePlayback。
  throw new Error('请通过 LxMusicSource.getMusicUrl 获取播放地址（需配置 lx-music-api-server）')
}
