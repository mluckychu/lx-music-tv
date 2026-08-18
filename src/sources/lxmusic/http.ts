/**
 * lx-music 真源码协议 —— HTTP 请求封装
 * ----------------------------------------------------------------------------
 * 对标 lx-music 的 httpFetch：返回 { statusCode, body, headers }，body 自动按
 * JSON 解析；binary:true 时返回原始 ArrayBuffer（歌词解密用）。
 *
 * 仅依赖 RN 全局 fetch + AbortController，无原生模块依赖。
 */

// pako / iconv-lite 依赖 Node Buffer；在 RN 中 polyfill 一个（须在任何使用 Buffer
// 的模块求值前执行，故放在本文件顶部——本文件总被最先 import）。
import { Buffer as RnBuffer } from 'buffer'
if (!(globalThis as any).Buffer) {
  ;(globalThis as any).Buffer = RnBuffer
}

export interface HttpResponse {
  statusCode: number
  body: any
  headers: Record<string, string>
  raw?: ArrayBuffer
}

export interface HttpOptions {
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  timeout?: number
  binary?: boolean
  body?: string
  /** 表单字段，自动做 x-www-form-urlencoded 编码并设置 Content-Type */
  form?: Record<string, string | number | boolean>
}

export async function httpFetch(url: string, options: HttpOptions = {}): Promise<HttpResponse> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  let timer: ReturnType<typeof setTimeout> | null = null
  if (controller && options.timeout) {
    timer = setTimeout(() => controller.abort(), options.timeout)
  }
  let bodyStr: string | undefined = options.body
  const headers: Record<string, string> = { ...(options.headers || {}) }
  if (options.form) {
    bodyStr = Object.entries(options.form)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }
  try {
    const res = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      signal: controller ? controller.signal : undefined,
      body: bodyStr,
    })
    const respHeaders: Record<string, string> = {}
    // rn-fetch-api 的 Headers.forEach 存在，但做防御
    if (typeof (res.headers as any).forEach === 'function') {
      ;(res.headers as any).forEach((v: string, k: string) => {
        respHeaders[k] = v
      })
    } else {
      // 兜底：遍历已知字段
      const entries = (res.headers as any).entries ? (res.headers as any).entries() : []
      for (const [k, v] of entries) respHeaders[k] = v
    }

    if (options.binary) {
      const buf = await res.arrayBuffer()
      return { statusCode: res.status, body: buf, headers: respHeaders, raw: buf }
    }
    const text = await res.text()
    let body: any = text
    const ct = (respHeaders['content-type'] || respHeaders['Content-Type'] || '').toLowerCase()
    if (ct.includes('json') || (text && /^\s*[[{]/.test(text))) {
      try {
        body = JSON.parse(text)
      } catch {
        body = text
      }
    }
    return { statusCode: res.status, body, headers }
  } finally {
    if (timer) clearTimeout(timer)
  }
}
