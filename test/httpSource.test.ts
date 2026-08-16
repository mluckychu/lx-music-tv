import assert from 'node:assert'
import { buildUrl, normalizeSong, extractList } from '../src/sources/httpSource'

// 基础 URL：去除尾部斜杠
assert.equal(buildUrl('https://example.com/', 'search', { keyword: 'a', source: 'kw' }),
  'https://example.com/search?keyword=a&source=kw')

// 中文与特殊字符编码
const u = buildUrl('https://example.com', 'search', { keyword: '周杰伦', source: 'kw', page: 1 })
assert.ok(u.includes('keyword='))
assert.ok(decodeURIComponent(u).includes('keyword=周杰伦'))
assert.ok(u.includes('source=kw'))
assert.ok(u.includes('page=1'))

// 空值参数被忽略
assert.equal(buildUrl('https://example.com', 'musicUrl', { id: '123', source: 'kw', quality: '' }),
  'https://example.com/musicUrl?id=123&source=kw')

// 无参数
assert.equal(buildUrl('https://example.com', 'home'), 'https://example.com/home')

// 字段别名归一化（name/songname、singer/songer）
const s = normalizeSong({ songname: '晴天', songer: '周杰伦', albumname: '叶惠美', songmid: 'abc' })
assert.equal(s.name, '晴天')
assert.equal(s.singer, '周杰伦')
assert.equal(s.album, '叶惠美')
assert.equal(s.id, 'abc')

// 列表提取兼容 { list } 与直接数组
assert.equal(extractList({ list: [{ name: 'x' }] }).length, 1)
assert.equal(extractList([{ name: 'y' }]).length, 1)
assert.equal(extractList({ songs: [{ name: 'z' }] }).length, 1)

console.log('✅ httpSource 测试通过')
