/**
 * 酷我 wbd 接口 —— 签名 / 加解密（纯 JS 复刻 lx-music kw/util.js 的 wbdCrypto）
 * ----------------------------------------------------------------------------
 * 复刻 lyswhut/lx-music-mobile 的 kw/util.js 中 wbdCrypto，但用自研的纯 JS
 * AES-128-ECB 取代原生 CryptoModule，避免对 RN 原生模块的依赖：
 *
 *  - AES 密钥：cFcnPcf6Kb85RC1y3V6M5A==（base64 -> 16 字节）
 *  - 模式：AES-128-ECB，请求体用 PKCS7 填充，响应体用 PKCS7 去填充
 *  - 请求构造：原始 JSON 字节 -> PKCS7 填充 -> AES 加密 -> base64(encB64)
 *              sign = md5(appId + encB64 + time).toUpperCase()
 *  - 响应解析：URL 解码 -> base64 解码 -> AES 解密 -> PKCS7 去填充 -> JSON.parse
 *
 * 已在 Node 中对照 Node crypto 及 FIPS 已知向量验证（单块/多块/已知答案全 PASS），
 * 并对其真实 wbd.kuwo.cn/api/bd/bang/bang_info 接口完成端到端往返验证。
 */
import { md5 } from './codec'
import { Buffer as RnBuffer } from 'buffer'

const Buffer: any = RnBuffer

// ----------------------------- 纯 JS AES-128-ECB -----------------------------
const Sbox: number[] = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
]
const Rcon: number[] = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36]

function keyExpansion(key: number[]): number[][] {
  const Nk = 4
  const Nr = 10
  const w: number[][] = new Array(4 * (Nr + 1))
  for (let i = 0; i < Nk; i++) w[i] = [key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]]
  for (let i = Nk; i < 4 * (Nr + 1); i++) {
    let t = w[i - 1].slice()
    if (i % Nk === 0) {
      t = [t[1], t[2], t[3], t[0]] // RotWord
      t = t.map((v) => Sbox[v]) // SubWord
      t[0] ^= Rcon[i / Nk - 1]
    }
    w[i] = [w[i - Nk][0] ^ t[0], w[i - Nk][1] ^ t[1], w[i - Nk][2] ^ t[2], w[i - Nk][3] ^ t[3]]
  }
  return w
}
function xtime(a: number): number {
  return ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 0xff
}
function mixSingle(a: number[]): number[] {
  return [
    xtime(a[0]) ^ xtime(a[1]) ^ a[1] ^ a[2] ^ a[3],
    a[0] ^ xtime(a[1]) ^ xtime(a[2]) ^ a[2] ^ a[3],
    a[0] ^ a[1] ^ xtime(a[2]) ^ xtime(a[3]) ^ a[3],
    xtime(a[0]) ^ a[1] ^ a[2] ^ xtime(a[3]) ^ a[0],
  ]
}
function gmul(a: number, b: number): number {
  let p = 0
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a
    const hi = a & 0x80
    a = (a << 1) & 0xff
    if (hi) a ^= 0x1b
    b >>= 1
  }
  return p
}
function invMixSingle(a: number[]): number[] {
  const a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3]
  return [
    gmul(a0, 14) ^ gmul(a1, 11) ^ gmul(a2, 13) ^ gmul(a3, 9),
    gmul(a0, 9) ^ gmul(a1, 14) ^ gmul(a2, 11) ^ gmul(a3, 13),
    gmul(a0, 13) ^ gmul(a1, 9) ^ gmul(a2, 14) ^ gmul(a3, 11),
    gmul(a0, 11) ^ gmul(a1, 13) ^ gmul(a2, 9) ^ gmul(a3, 14),
  ]
}
function addRoundKey(state: number[], w: number[][], r: number): void {
  for (let c = 0; c < 4; c++) for (let row = 0; row < 4; row++) state[4 * c + row] ^= w[r * 4 + c][row]
}
function aesEncryptBlock(block: number[], w: number[][]): number[] {
  const Nr = 10
  let state = block.slice()
  addRoundKey(state, w, 0)
  for (let r = 1; r <= Nr; r++) {
    state = state.map((v) => Sbox[v])
    const sr = [
      state[0], state[5], state[10], state[15], state[4], state[9], state[14], state[3],
      state[8], state[13], state[2], state[7], state[12], state[1], state[6], state[11],
    ]
    if (r < Nr) {
      const mc = new Array(16)
      for (let c = 0; c < 4; c++) {
        const col = [sr[c * 4], sr[c * 4 + 1], sr[c * 4 + 2], sr[c * 4 + 3]]
        const m = mixSingle(col)
        for (let k = 0; k < 4; k++) mc[c * 4 + k] = m[k]
      }
      state = mc
    } else state = sr
    addRoundKey(state, w, r)
  }
  return state
}
function aesDecryptBlock(block: number[], w: number[][]): number[] {
  const Nr = 10
  let state = block.slice()
  addRoundKey(state, w, Nr)
  const InvSbox: number[] = new Array(256)
  for (let i = 0; i < 256; i++) InvSbox[Sbox[i]] = i
  for (let r = Nr - 1; r >= 1; r--) {
    const isr = [
      state[0], state[13], state[10], state[7], state[4], state[1], state[14], state[11],
      state[8], state[5], state[2], state[15], state[12], state[9], state[6], state[3],
    ]
    state = isr.map((v) => InvSbox[v])
    addRoundKey(state, w, r)
    const mc = new Array(16)
    for (let c = 0; c < 4; c++) {
      const col = [state[c * 4], state[c * 4 + 1], state[c * 4 + 2], state[c * 4 + 3]]
      const m = invMixSingle(col)
      for (let k = 0; k < 4; k++) mc[c * 4 + k] = m[k] & 0xff
    }
    state = mc
  }
  const isr = [
    state[0], state[13], state[10], state[7], state[4], state[1], state[14], state[11],
    state[8], state[5], state[2], state[15], state[12], state[9], state[6], state[3],
  ]
  state = isr.map((v) => InvSbox[v])
  addRoundKey(state, w, 0)
  return state
}

export function aes128ecbEncrypt(dataBytes: Uint8Array, keyBytes: Uint8Array): Uint8Array {
  const w = keyExpansion(Array.from(keyBytes))
  const out = new Uint8Array(dataBytes.length)
  for (let off = 0; off < dataBytes.length; off += 16) {
    const blk = Array.from(dataBytes.subarray(off, off + 16))
    const e = aesEncryptBlock(blk, w)
    for (let i = 0; i < 16; i++) out[off + i] = e[i]
  }
  return out
}
export function aes128ecbDecrypt(dataBytes: Uint8Array, keyBytes: Uint8Array): Uint8Array {
  const w = keyExpansion(Array.from(keyBytes))
  const out = new Uint8Array(dataBytes.length)
  for (let off = 0; off < dataBytes.length; off += 16) {
    const blk = Array.from(dataBytes.subarray(off, off + 16))
    const d = aesDecryptBlock(blk, w)
    for (let i = 0; i < 16; i++) out[off + i] = d[i]
  }
  return out
}

// ----------------------------- PKCS7 填充 / 去填充 ---------------------------
export function pkcs7Pad(buf: Uint8Array): Uint8Array {
  const p = 16 - (buf.length % 16)
  const out = new Uint8Array(buf.length + p)
  out.set(buf)
  out.fill(p, buf.length)
  return out
}
export function pkcs7Unpad(buf: Uint8Array): Uint8Array {
  if (buf.length === 0) return buf
  const p = buf[buf.length - 1]
  if (p > 0 && p <= 16) return buf.subarray(0, buf.length - p)
  return buf
}

// ------------------------------- wbdCrypto -----------------------------------
export const wbdCrypto = {
  aesKey: 'cFcnPcf6Kb85RC1y3V6M5A==',
  aesIv: '',
  appId: 'y67sprxhhpws',

  /** 原始 JSON 字节 -> PKCS7 填充 -> AES-128-ECB 加密 -> base64(encB64) */
  _aesEncrypt(rawJsonBytes: Uint8Array): Uint8Array {
    const key = new Uint8Array(Buffer.from(this.aesKey, 'base64'))
    return aes128ecbEncrypt(pkcs7Pad(rawJsonBytes), key)
  },

  /** 构造 wbd 接口请求 query 串：data / time / appId / sign */
  buildParam(jsonData: any): string {
    const rawBytes = new Uint8Array(Buffer.from(JSON.stringify(jsonData), 'utf8'))
    const enc = this._aesEncrypt(rawBytes)
    const encB64 = Buffer.from(enc).toString('base64')
    const time = Date.now()
    const sign = md5(this.appId + encB64 + time).toUpperCase()
    return `data=${encodeURIComponent(encB64)}&time=${time}&appId=${this.appId}&sign=${sign}`
  },

  /** 解密 wbd 接口响应（URL 编码的 base64 密文）-> JSON 对象 */
  decodeData(base64Result: string): any {
    const data = decodeURIComponent(base64Result)
    const ct = new Uint8Array(Buffer.from(data, 'base64'))
    const key = new Uint8Array(Buffer.from(this.aesKey, 'base64'))
    const dec = aes128ecbDecrypt(ct, key)
    const jsonText = Buffer.from(pkcs7Unpad(dec)).toString('utf8')
    return JSON.parse(jsonText)
  },
}

export default wbdCrypto
