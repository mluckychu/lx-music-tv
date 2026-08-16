/**
 * 空间焦点导航 (Spatial Navigation) —— 纯逻辑，无 RN 依赖，可单测。
 * ---------------------------------------------------------------
 * 电视遥控器只有 上/下/左/右/确认/返回。要让方向键在任意布局（海报网格、
 * 侧边栏、列表）中都能自然地移动焦点，需要一套"就近聚焦"算法：
 * 当用户按右方向键时，从当前焦点元素出发，在所有"位于右侧"的候选元素中，
 * 选出整体距离最近、且垂直于移动方向上的偏移最小的元素作为新焦点。
 */

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface FocusNode {
  id: string
  rect: Rect
}

const TOL = 0.5 // 容差，避免浮点误差把"略右"判成"正右"

function center(r: Rect): { x: number; y: number } {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
}

/** 两个矩形在某一轴上的重叠长度（无重叠返回 0） */
function overlapOn(a: Rect, b: Rect, axis: 'x' | 'y'): number {
  const aStart = axis === 'x' ? a.x : a.y
  const aEnd = aStart + (axis === 'x' ? a.width : a.height)
  const bStart = axis === 'x' ? b.x : b.y
  const bEnd = bStart + (axis === 'x' ? b.width : b.height)
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart))
}

/**
 * 判断候选矩形 `c` 是否位于当前矩形 `cur` 的 `dir` 方向上。
 * 要求：在移动轴上有正向间隙（或紧贴），且在垂直轴上存在至少部分重叠或接近。
 */
function isInDirection(cur: Rect, c: Rect, dir: Direction): boolean {
  const curR = cur.x + cur.width
  const curB = cur.y + cur.height
  const cR = c.x + c.width
  const cB = c.y + c.height
  switch (dir) {
    case 'right':
      return c.x >= curR - TOL
    case 'left':
      return cR <= cur.x + TOL
    case 'down':
      return c.y >= curB - TOL
    case 'up':
      return cB <= cur.y + TOL
  }
}

/**
 * 计算候选 `c` 相对当前 `cur`、朝 `dir` 方向的得分，越低越优。
 * 得分 = 主轴正向间隙 + 垂直偏移惩罚 - 垂直重叠奖励
 */
function score(cur: Rect, c: Rect, dir: Direction): number {
  const curC = center(cur)
  const cC = center(c)
  const primaryGap =
    dir === 'right'
      ? c.x - (cur.x + cur.width)
      : dir === 'left'
      ? cur.x - (c.x + c.width)
      : dir === 'down'
      ? c.y - (cur.y + cur.height)
      : cur.y - (c.y + c.height)

  const perpAxis: 'x' | 'y' = dir === 'left' || dir === 'right' ? 'y' : 'x'
  const perpDist = Math.abs(cC[perpAxis] - curC[perpAxis])
  const overlap = overlapOn(cur, c, perpAxis)
  // 垂直重叠越多越好：用重叠量给折扣；否则用中心距离惩罚
  const perpPenalty = overlap > 0 ? Math.max(0, cC[perpAxis] - curC[perpAxis] === 0 ? 0 : perpDist * 0.6 - overlap * 1.4) : perpDist

  // 主轴权重略高，保证"先朝按键方向走"，垂直只用于同排内择优
  return primaryGap + Math.max(0, perpPenalty) * 1.1
}

/**
 * 在 nodes 中，从 currentId 出发沿 dir 找到下一个最优焦点 id。
 * 没有合适候选时返回 null（调用方可据此保持焦点不动或做边界回环）。
 */
export function findNextFocus(
  currentId: string,
  dir: Direction,
  nodes: FocusNode[],
): string | null {
  const cur = nodes.find((n) => n.id === currentId)
  if (!cur) return null

  let best: string | null = null
  let bestScore = Infinity
  for (const n of nodes) {
    if (n.id === currentId) continue
    if (!isInDirection(cur.rect, n.rect, dir)) continue
    const sc = score(cur.rect, n.rect, dir)
    if (sc < bestScore) {
      bestScore = sc
      best = n.id
    }
  }
  return best
}

/**
 * 边界回环：当某方向无候选焦点时，跳到该行/列最远端，提升遥控体验。
 * 这里实现"同行最左/最右、同列最上/最下"的简单回环。
 */
export function wrapFocus(
  currentId: string,
  dir: Direction,
  nodes: FocusNode[],
): string | null {
  const cur = nodes.find((n) => n.id === currentId)
  if (!cur) return null
  const curC = center(cur.rect)
  let best: string | null = null
  let bestVal = dir === 'right' || dir === 'down' ? Infinity : -Infinity
  for (const n of nodes) {
    if (n.id === currentId) continue
    const c = center(n.rect)
    if (dir === 'right') {
      // 末尾向右 -> 回环到最左列
      if (c.x < bestVal) { bestVal = c.x; best = n.id }
    } else if (dir === 'left') {
      // 开头向左 -> 回环到最右列
      if (c.x > bestVal) { bestVal = c.x; best = n.id }
    } else if (dir === 'down') {
      // 底部向下 -> 回环到最上行
      if (c.y < bestVal) { bestVal = c.y; best = n.id }
    } else {
      // 顶部向上 -> 回环到最下行
      if (c.y > bestVal) { bestVal = c.y; best = n.id }
    }
  }
  void curC
  return best
}
