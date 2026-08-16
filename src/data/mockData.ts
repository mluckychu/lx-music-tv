import { ChannelRow, MusicInfo, PosterItem } from '@/sources/types'

/**
 * 离线演示数据。封面图留空，组件会渲染带标题的渐变占位块，
 * 避免依赖外部网络图片（TV 离线也能完整演示导航与界面）。
 */

export const MOCK_SONGS: MusicInfo[] = [
  { id: 'm1', source: 'mock', name: '晴天', singer: '周杰伦', album: '叶惠美', interval: '04:29', qualitys: ['128k', '320k', 'flac'] },
  { id: 'm2', source: 'mock', name: '稻香', singer: '周杰伦', album: '魔杰座', interval: '03:43', qualitys: ['128k', '320k'] },
  { id: 'm3', source: 'mock', name: '七里香', singer: '周杰伦', album: '七里香', interval: '04:59', qualitys: ['128k', '320k', 'flac'] },
  { id: 'm4', source: 'mock', name: '告白气球', singer: '周杰伦', album: '周杰伦的床边故事', interval: '03:35', qualitys: ['128k', '320k'] },
  { id: 'm5', source: 'mock', name: '夜曲', singer: '周杰伦', album: '十一月的萧邦', interval: '03:46', qualitys: ['128k', '320k', 'flac'] },
  { id: 'm6', source: 'mock', name: '平凡之路', singer: '朴树', album: '后会无期', interval: '04:08', qualitys: ['128k', '320k'] },
  { id: 'm7', source: 'mock', name: '生如夏花', singer: '朴树', album: '生如夏花', interval: '04:16', qualitys: ['128k', '320k'] },
  { id: 'm8', source: 'mock', name: '海阔天空', singer: 'Beyond', album: '乐与怒', interval: '05:25', qualitys: ['128k', '320k', 'flac'] },
  { id: 'm9', source: 'mock', name: '光辉岁月', singer: 'Beyond', album: '命运派对', interval: '05:02', qualitys: ['128k', '320k'] },
  { id: 'm10', source: 'mock', name: '演员', singer: '薛之谦', album: '绅士', interval: '04:21', qualitys: ['128k', '320k'] },
  { id: 'm11', source: 'mock', name: '丑八怪', singer: '薛之谦', album: '意外', interval: '04:08', qualitys: ['128k', '320k'] },
  { id: 'm12', source: 'mock', name: '理想三旬', singer: '陈鸿宇', album: '浓烟下的诗歌电台', interval: '04:30', qualitys: ['128k', '320k'] },
  { id: 'm13', source: 'mock', name: '成都', singer: '赵雷', album: '无法长大', interval: '05:28', qualitys: ['128k', '320k'] },
  { id: 'm14', source: 'mock', name: '南山南', singer: '马頔', album: '孤岛', interval: '04:22', qualitys: ['128k', '320k'] },
  { id: 'm15', source: 'mock', name: '体面', singer: '于文文', album: '体面', interval: '04:43', qualitys: ['128k', '320k'] },
  { id: 'm16', source: 'mock', name: '说散就散', singer: 'JC陈泳彤', album: '前任3', interval: '04:15', qualitys: ['128k', '320k'] },
  { id: 'm17', source: 'mock', name: '光年之外', singer: '邓紫棋', album: '光年之外', interval: '03:55', qualitys: ['128k', '320k', 'flac'] },
  { id: 'm18', source: 'mock', name: '泡沫', singer: '邓紫棋', album: 'Xposed', interval: '04:15', qualitys: ['128k', '320k'] },
  { id: 'm19', source: 'mock', name: '起风了', singer: '买辣椒也用券', album: '起风了', interval: '05:25', qualitys: ['128k', '320k'] },
  { id: 'm20', source: 'mock', name: '星辰大海', singer: '黄霄雲', album: '星辰大海', interval: '03:30', qualitys: ['128k', '320k'] },
]

function poster(id: string, title: string, subtitle: string, type: PosterItem['type'] = 'list', payload?: any): PosterItem {
  return { id, title, subtitle, type, payload }
}

export const MOCK_CHANNELS: ChannelRow[] = [
  {
    id: 'ch_recommend',
    title: '为你推荐',
    items: [
      poster('pl_1', '华语流行精选', '周杰伦 / 邓紫棋 / 薛之谦', 'list', { listId: 'pl_1' }),
      poster('pl_2', '经典老歌', 'Beyond / 朴树 / 老歌回忆', 'list', { listId: 'pl_2' }),
      poster('pl_3', '民谣故事', '赵雷 / 马頔 / 陈鸿宇', 'list', { listId: 'pl_3' }),
      poster('pl_4', '影视金曲', '电影原声 / OST', 'list', { listId: 'pl_4' }),
      poster('pl_5', '深夜电台', '舒缓助眠', 'list', { listId: 'pl_5' }),
      poster('pl_6', '运动燃曲', '节奏动感', 'list', { listId: 'pl_6' }),
    ],
  },
  {
    id: 'ch_top',
    title: '排行榜',
    items: [
      poster('top_hot', '热歌榜', '实时最热', 'category', { topId: 'hot' }),
      poster('top_new', '新歌榜', '最新上线', 'category', { topId: 'new' }),
      poster('top_original', '原创榜', '音乐人原创', 'category', { topId: 'original' }),
      poster('top_network', '网络榜', '全网热搜', 'category', { topId: 'network' }),
    ],
  },
  {
    id: 'ch_genre',
    title: '曲风频道',
    items: [
      poster('g_pop', '流行', 'Pop', 'category', { genre: 'pop' }),
      poster('g_rock', '摇滚', 'Rock', 'category', { genre: 'rock' }),
      poster('g_folk', '民谣', 'Folk', 'category', { genre: 'folk' }),
      poster('g_elec', '电子', 'Electronic', 'category', { genre: 'elec' }),
      poster('g_classic', '轻音乐', 'Easy Listening', 'category', { genre: 'classic' }),
      poster('g_ost', '影视原声', 'OST', 'category', { genre: 'ost' }),
    ],
  },
  {
    id: 'ch_singer',
    title: '歌手',
    items: [
      poster('s_jay', '周杰伦', '华语流行', 'singer', { singer: '周杰伦' }),
      poster('s_beyond', 'Beyond', '摇滚经典', 'singer', { singer: 'Beyond' }),
      poster('s_gem', '邓紫棋', '流行', 'singer', { singer: '邓紫棋' }),
      poster('s_xue', '薛之谦', '情歌', 'singer', { singer: '薛之谦' }),
      poster('s_zhao', '赵雷', '民谣', 'singer', { singer: '赵雷' }),
    ],
  },
  {
    id: 'ch_theme',
    title: '场景电台',
    items: [
      poster('th_morning', '清晨元气', '唤醒一天', 'category', { theme: 'morning' }),
      poster('th_work', '专注工作', '纯音乐', 'category', { theme: 'work' }),
      poster('th_party', '派对时间', '嗨起来', 'category', { theme: 'party' }),
      poster('th_sleep', '安眠之夜', '助眠', 'category', { theme: 'sleep' }),
    ],
  },
]
