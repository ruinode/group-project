import test from 'node:test'
import assert from 'node:assert/strict'
import { createPlazaWalker } from '../src/utils/plaza-motion.js'

test('豆豆按点击目标沿步道移动，抵达后停下且不会穿过中心树岛', () => {
  const walker = createPlazaWalker({ position: { x: 0.46, y: 0.68 } })
  walker.moveTo({ x: 0.59, y: 0.39 })
  assert.equal(walker.getState().moving, true)
  const samples = []
  for (let i = 0; i < 100; i++) {
    walker.advance(0.1)
    samples.push(walker.getState().position)
  }
  const state = walker.getState()
  assert.equal(state.moving, false)
  assert.ok(Math.abs(state.position.x - 0.59) < 0.001)
  assert.ok(Math.abs(state.position.y - 0.39) < 0.001)
  assert.ok(
    samples.every(
      (p) => !(p.x > 0.43 && p.x < 0.59 && p.y > 0.43 && p.y < 0.59)
    ),
    '行走路径不能横穿中心树岛'
  )
})

test('建筑外的点击也只能抵达步道，大步进抵达目标而不会越界', () => {
  const walker = createPlazaWalker()
  walker.moveTo({ x: 10, y: -10 })
  walker.advance(1000)
  const state = walker.getState()
  assert.equal(state.moving, false)
  assert.ok(Math.abs(state.position.x - 0.68) < 0.001)
  assert.ok(Math.abs(state.position.y - 0.45) < 0.001)
})

test('停止后位置保持，新的移动指令可替换旧目标，无效坐标被拒绝', () => {
  const walker = createPlazaWalker()
  walker.moveTo({ x: 0.59, y: 0.39 })
  walker.advance(0.2)
  walker.stop()
  const stopped = walker.getState().position
  walker.advance(5)
  assert.deepEqual(walker.getState().position, stopped)
  walker.moveTo({ x: 0.33, y: 0.5 })
  walker.advance(100)
  assert.ok(Math.abs(walker.getState().position.x - 0.33) < 0.001)
  assert.throws(() => walker.moveTo({ x: NaN, y: 0 }), TypeError)
  assert.equal(walker.getState().moving, false)
})
