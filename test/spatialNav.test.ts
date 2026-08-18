import assert from 'assert'
import { findNextFocus, wrapFocus, FocusNode } from '../src/navigation/spatialNav'

// 3x3 网格，单元 100x100，间距 10
const C = 100
const G = 10
function grid(): FocusNode[] {
  const nodes: FocusNode[] = []
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      nodes.push({
        id: `r${r}c${c}`,
        rect: { x: c * (C + G), y: r * (C + G), width: C, height: C },
      })
    }
  }
  return nodes
}
const nodes = grid()

// 右：r0c0 -> r0c1
assert.equal(findNextFocus('r0c0', 'right', nodes), 'r0c1')
// 右：r1c1 -> r1c2
assert.equal(findNextFocus('r1c1', 'right', nodes), 'r1c2')
// 下：r0c0 -> r1c0
assert.equal(findNextFocus('r0c0', 'down', nodes), 'r1c0')
// 上：r2c2 -> r1c2
assert.equal(findNextFocus('r2c2', 'up', nodes), 'r1c2')
// 左：r0c2 -> r0c1
assert.equal(findNextFocus('r0c2', 'left', nodes), 'r0c1')

// 带垂直偏移也应选同排最近者
// 在 r0c1 右侧再放一个略偏下的元素 rX，应优先已对齐的 r0c2
const withOffset: FocusNode[] = [
  ...nodes,
  { id: 'rX', rect: { x: 220, y: 40, width: C, height: C } }, // 与 r0c2 同 x，但 y 略下
]
assert.equal(findNextFocus('r0c1', 'right', withOffset), 'r0c2')

// 末列向右无候选 -> findNextFocus 返回 null
assert.equal(findNextFocus('r0c2', 'right', nodes), null)
// 回环：末列向右回环到最左
assert.equal(wrapFocus('r0c2', 'right', nodes), 'r0c0')
assert.equal(wrapFocus('r2c0', 'down', nodes), 'r0c0')

console.log('✅ spatialNav 测试通过')
