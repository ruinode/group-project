// 背景中的闭合步道；坐标独立于屏幕尺寸，避开四栋建筑和中心树岛。
export const PLAZA_ROAD = [
  { x: 0.43, y: 0.36 },
  { x: 0.59, y: 0.39 },
  { x: 0.68, y: 0.45 },
  { x: 0.67, y: 0.55 },
  { x: 0.58, y: 0.63 },
  { x: 0.46, y: 0.68 },
  { x: 0.34, y: 0.6 },
  { x: 0.33, y: 0.5 },
  { x: 0.37, y: 0.43 }
]
const road = PLAZA_ROAD
const aspect = 801 / 1280
let perimeter = 0
const segments = road.map((start, index) => {
  const end = road[(index + 1) % road.length]
  const dx = end.x - start.x
  const dy = (end.y - start.y) * aspect
  const segment = {
    start,
    end,
    dx,
    dy,
    offset: perimeter,
    length: Math.hypot(dx, dy)
  }
  perimeter += segment.length
  return segment
})
const wrap = (distance) => ((distance % perimeter) + perimeter) % perimeter

function positionAt(distance) {
  const offset = wrap(distance)
  const segment =
    segments.find((s) => offset < s.offset + s.length) || segments[0]
  const fraction = (offset - segment.offset) / segment.length
  return {
    x: segment.start.x + (segment.end.x - segment.start.x) * fraction,
    y: segment.start.y + (segment.end.y - segment.start.y) * fraction
  }
}

function project(point) {
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y))
    throw new TypeError('场景坐标必须是有效数字')
  let best = { distance: Infinity, offset: 0 }
  for (const segment of segments) {
    const dx = point.x - segment.start.x
    const dy = (point.y - segment.start.y) * aspect
    const fraction = Math.max(
      0,
      Math.min(1, (dx * segment.dx + dy * segment.dy) / segment.length ** 2)
    )
    const distance = Math.hypot(
      dx - segment.dx * fraction,
      dy - segment.dy * fraction
    )
    if (distance < best.distance)
      best = { distance, offset: segment.offset + segment.length * fraction }
  }
  return wrap(best.offset)
}

export function createPlazaWalker({ position = road[5], speed = 0.12 } = {}) {
  if (!Number.isFinite(speed) || speed <= 0)
    throw new TypeError('移动速度必须大于零')
  let offset = project(position)
  let goal = offset
  let remaining = 0
  let direction = 1
  let facing = 1
  const getState = () => ({
    position: positionAt(offset),
    target: remaining > 0 ? positionAt(goal) : null,
    moving: remaining > 0,
    facing
  })
  return {
    getState,
    moveTo(point) {
      goal = project(point)
      const clockwise = wrap(goal - offset)
      const difference =
        clockwise > perimeter / 2 ? clockwise - perimeter : clockwise
      remaining = Math.abs(difference) < 0.000001 ? 0 : Math.abs(difference)
      direction = difference < 0 ? -1 : 1
      return getState()
    },
    advance(seconds) {
      if (!Number.isFinite(seconds) || seconds <= 0 || !remaining)
        return getState()
      const previous = positionAt(offset)
      const step = Math.min(remaining, speed * seconds)
      remaining = Math.max(0, remaining - step)
      offset = remaining < 0.000001 ? goal : wrap(offset + step * direction)
      if (remaining < 0.000001) remaining = 0
      const next = positionAt(offset)
      if (Math.abs(next.x - previous.x) > 0.00001)
        facing = next.x > previous.x ? 1 : -1
      return getState()
    },
    stop() {
      remaining = 0
      return getState()
    }
  }
}
