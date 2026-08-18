/**
 * lx-music 真源码协议 —— 编解码辅助
 * ----------------------------------------------------------------------------
 * 复刻 lx-music musicSdk 的通用工具：
 *  - formatPlayTime   秒 -> "mm:ss"
 *  - sizeFormate      字节 -> "x MB"
 *  - decodeName       kuwo 接口 encoding=utf8 时已是 UTF-8 字符串，原样返回
 *  - formatSinger     把 "&" 换成 "、"（lx-music 习惯）
 *  - objStr2JSON      解析 kuwo 单引号 JSON（songList 搜索响应）
 *  - md5              纯 JS 实现（咪咕签名用）
 *  - toUTF8 / toGBK   字节解码辅助（歌词用）
 */

export function formatPlayTime(sec?: number | string): string {
  if (sec == null) return '00:00'
  let t = typeof sec === 'string' ? parseInt(sec, 10) : sec
  if (Number.isNaN(t) || t < 0) t = 0
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function sizeFormate(size?: number | string): string {
  if (size == null) return ''
  const n = typeof size === 'string' ? parseFloat(size) : size
  if (!n || n <= 0) return ''
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)}KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)}MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)}GB`
}

export function decodeName(s: any): string {
  if (s == null) return ''
  if (typeof s === 'string') return s
  // 极少数接口返回 Buffer/字节，兜底按 utf8 处理
  try {
    return new TextDecoder().decode(new Uint8Array(s as any))
  } catch {
    return String(s)
  }
}

export function formatSinger(raw: any): string {
  return String(raw == null ? '' : raw).replace(/&/g, '、')
}

/** 歌手数组 -> "、”分隔字符串（复刻 lx-music utils.formatSingerName） */
export function formatSingerName(singers: any, nameKey = 'name', join = '、'): string {
  if (Array.isArray(singers)) {
    const arr: string[] = []
    for (const it of singers) {
      const name = it?.[nameKey]
      if (name) arr.push(decodeName(name))
    }
    return arr.join(join)
  }
  return decodeName(singers == null ? '' : singers)
}

/** 解析 kuwo 单引号 JSON（songList 搜索返回 '...' 而非 "..."） */
export function objStr2JSON(str: string): any {
  return JSON.parse(
    str.replace(
      /('(?=(,\s*')))|('(?=:))|((?<=([:,]\s*))')|((?<={)')|('(?=}))/g,
      '"',
    ),
  )
}

// ----------------------------- 纯 JS MD5 -----------------------------------
// 复刻 blueimp / RFC1321 的标准实现，用于咪咕搜索签名。
// 关键点（之前的实现有两处硬伤，已修正）：
//  1) 每轮 F 的结果必须加回当轮“b”位置变量（b,a,d,c 轮换），
//     而不是简单地 `new = rotl(...)`；
//  2) 64 个 T 常量必须精确，其中第 60 步常量为 -2054922799
//     （极易误写为 -2054922629）。
function _ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  const n = a + (b & c | ~b & d) + (x >>> 0) + t
  return ((n << s) | (n >>> (32 - s))) + b
}
function _gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  const n = a + (b & d | c & ~d) + (x >>> 0) + t
  return ((n << s) | (n >>> (32 - s))) + b
}
function _hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  const n = a + (b ^ c ^ d) + (x >>> 0) + t
  return ((n << s) | (n >>> (32 - s))) + b
}
function _ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  const n = a + (c ^ (b | ~d)) + (x >>> 0) + t
  return ((n << s) | (n >>> (32 - s))) + b
}
function md5cycle(
  a: number,
  b: number,
  c: number,
  d: number,
  m: number[],
): [number, number, number, number] {
  const aa = a, bb = b, cc = c, dd = d
  a = _ff(a, b, c, d, m[0], 7, -680876936); d = _ff(d, a, b, c, m[1], 12, -389564586); c = _ff(c, d, a, b, m[2], 17, 606105819); b = _ff(b, c, d, a, m[3], 22, -1044525330)
  a = _ff(a, b, c, d, m[4], 7, -176418897); d = _ff(d, a, b, c, m[5], 12, 1200080426); c = _ff(c, d, a, b, m[6], 17, -1473231341); b = _ff(b, c, d, a, m[7], 22, -45705983)
  a = _ff(a, b, c, d, m[8], 7, 1770035416); d = _ff(d, a, b, c, m[9], 12, -1958414417); c = _ff(c, d, a, b, m[10], 17, -42063); b = _ff(b, c, d, a, m[11], 22, -1990404162)
  a = _ff(a, b, c, d, m[12], 7, 1804603682); d = _ff(d, a, b, c, m[13], 12, -40341101); c = _ff(c, d, a, b, m[14], 17, -1502002290); b = _ff(b, c, d, a, m[15], 22, 1236535329)
  a = _gg(a, b, c, d, m[1], 5, -165796510); d = _gg(d, a, b, c, m[6], 9, -1069501632); c = _gg(c, d, a, b, m[11], 14, 643717713); b = _gg(b, c, d, a, m[0], 20, -373897302)
  a = _gg(a, b, c, d, m[5], 5, -701558691); d = _gg(d, a, b, c, m[10], 9, 38016083); c = _gg(c, d, a, b, m[15], 14, -660478335); b = _gg(b, c, d, a, m[4], 20, -405537848)
  a = _gg(a, b, c, d, m[9], 5, 568446438); d = _gg(d, a, b, c, m[14], 9, -1019803690); c = _gg(c, d, a, b, m[3], 14, -187363961); b = _gg(b, c, d, a, m[8], 20, 1163531501)
  a = _gg(a, b, c, d, m[13], 5, -1444681467); d = _gg(d, a, b, c, m[2], 9, -51403784); c = _gg(c, d, a, b, m[7], 14, 1735328473); b = _gg(b, c, d, a, m[12], 20, -1926607734)
  a = _hh(a, b, c, d, m[5], 4, -378558); d = _hh(d, a, b, c, m[8], 11, -2022574463); c = _hh(c, d, a, b, m[11], 16, 1839030562); b = _hh(b, c, d, a, m[14], 23, -35309556)
  a = _hh(a, b, c, d, m[1], 4, -1530992060); d = _hh(d, a, b, c, m[4], 11, 1272893353); c = _hh(c, d, a, b, m[7], 16, -155497632); b = _hh(b, c, d, a, m[10], 23, -1094730640)
  a = _hh(a, b, c, d, m[13], 4, 681279174); d = _hh(d, a, b, c, m[0], 11, -358537222); c = _hh(c, d, a, b, m[3], 16, -722521979); b = _hh(b, c, d, a, m[6], 23, 76029189)
  a = _hh(a, b, c, d, m[9], 4, -640364487); d = _hh(d, a, b, c, m[12], 11, -421815835); c = _hh(c, d, a, b, m[15], 16, 530742520); b = _hh(b, c, d, a, m[2], 23, -995338651)
  a = _ii(a, b, c, d, m[0], 6, -198630844); d = _ii(d, a, b, c, m[7], 10, 1126891415); c = _ii(c, d, a, b, m[14], 15, -1416354905); b = _ii(b, c, d, a, m[5], 21, -57434055)
  a = _ii(a, b, c, d, m[12], 6, 1700485571); d = _ii(d, a, b, c, m[3], 10, -1894986606); c = _ii(c, d, a, b, m[10], 15, -1051523); b = _ii(b, c, d, a, m[1], 21, -2054922799)
  a = _ii(a, b, c, d, m[8], 6, 1873313359); d = _ii(d, a, b, c, m[15], 10, -30611744); c = _ii(c, d, a, b, m[6], 15, -1560198380); b = _ii(b, c, d, a, m[13], 21, 1309151649)
  a = _ii(a, b, c, d, m[4], 6, -145523070); d = _ii(d, a, b, c, m[11], 10, -1120210379); c = _ii(c, d, a, b, m[2], 15, 718787259); b = _ii(b, c, d, a, m[9], 21, -343485551)
  a = (a + aa) >>> 0; b = (b + bb) >>> 0; c = (c + cc) >>> 0; d = (d + dd) >>> 0
  return [a, b, c, d]
}

export function md5(input: string): string {
  const bytes = new TextEncoder().encode(input)
  const n = bytes.length
  const bitLen = n * 8
  const buf: number[] = []
  for (let i = 0; i < n; i++) buf.push(bytes[i])
  buf.push(0x80)
  while (buf.length % 64 !== 56) buf.push(0)
  for (let i = 0; i < 4; i++) buf.push((bitLen >>> (8 * i)) & 0xff)
  for (let i = 0; i < 4; i++) buf.push((Math.floor(bitLen / 0x100000000) >>> (8 * i)) & 0xff)
  const m: number[] = []
  for (let i = 0; i < buf.length; i += 4) {
    m.push((buf[i] | (buf[i + 1] << 8) | (buf[i + 2] << 16) | (buf[i + 3] << 24)) >>> 0)
  }
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878
  for (let i = 0; i < m.length; i += 16) {
    [a, b, c, d] = md5cycle(a, b, c, d, m.slice(i, i + 16))
  }
  const toHex = (v: number) => {
    let s = ''
    for (let i = 0; i < 4; i++) s += ((v >>> (i << 3)) & 255).toString(16).padStart(2, '0')
    return s
  }
  return toHex(a) + toHex(b) + toHex(c) + toHex(d)
}
