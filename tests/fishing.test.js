import test from 'node:test'
import assert from 'node:assert/strict'
import { createSeed } from '../src/mock/seed.js'
import { dispatchFishing } from '../src/mock/fishing.js'
import { linePosition } from '../src/utils/fishing-timing.js'
import {
  dispatchWardrobe,
  getWardrobeState,
  grantDiveReward
} from '../src/mock/wardrobe.js'

const startedAt = Date.parse('2026-10-15T10:00:00+08:00')
const owner = 'user_demo_a'
const run = (db, action, params = {}, now = startedAt, random = () => 0) =>
  dispatchFishing(db, owner, action, params, { now, random })
function catchOne(db, random = () => 0) {
  const cast = run(db, 'cast')
  const hooked = run(db, 'hook', { castId: cast.id }, cast.biteAt).cast
  return run(db, 'land', { castId: cast.id }, hooked.meterStartAt + 400, random)
}

test('旧演示存档可开始抛竿，返回独立状态与服务侧咬钩时间', () => {
  const db = createSeed()
  assert.deepEqual(run(db, 'getState'), {
    catchCount: 0,
    fishBook: [],
    collection: [],
    equipped: null,
    activeCast: null
  })
  const cast = run(db, 'cast')
  assert.equal(cast.status, 'waiting')
  assert.equal(cast.biteAt, startedAt + 1400)
  assert.equal(cast.escapeAt, startedAt + 3800)
  cast.biteAt = 0
  assert.equal(run(db, 'getState').activeCast.biteAt, startedAt + 1400)
  const state = run(db, 'getState')
  state.collection.push({ id: 'forged', name: '伪造奖品', count: 100 })
  assert.deepEqual(run(db, 'getState').collection, [])
})

test('提竿只认服务侧咬钩窗口，过早或错过会消费本次抛竿', () => {
  const db = createSeed()
  const early = run(db, 'cast')
  const missed = run(db, 'hook', { castId: early.id }, early.biteAt - 1)
  assert.equal(missed.status, 'escaped')
  assert.equal(missed.state.activeCast, null)
  assert.equal(missed.state.catchCount, 0)
  assert.throws(() => run(db, 'hook', { castId: early.id }, early.biteAt), {
    code: 'CONFLICT'
  })
  const late = run(db, 'cast')
  assert.equal(
    run(db, 'hook', { castId: late.id }, late.escapeAt + 1).status,
    'escaped'
  )
  const valid = run(db, 'cast')
  const hooked = run(db, 'hook', { castId: valid.id }, valid.biteAt)
  assert.equal(hooked.status, 'hooked')
  assert.equal(hooked.cast.status, 'hooked')
  assert.equal(hooked.cast.meterStartAt, valid.biteAt + 150)
  assert.equal(hooked.cast.meterPeriodMs, 1600)
  assert.deepEqual(hooked.cast.meterZone, [0.28, 0.78])
  assert.equal(hooked.cast.landDeadlineAt, valid.biteAt + 10000)
  hooked.cast.meterZone[0] = 0
  assert.deepEqual(run(db, 'getState').activeCast.meterZone, [0.28, 0.78])
})

test('钓获先通过收线时机判定，首次成功赠小荷叶，重复收线不得再次发奖', () => {
  const db = createSeed()
  const cast = run(db, 'cast')
  const hooked = run(db, 'hook', { castId: cast.id }, cast.biteAt).cast
  const caught = run(db, 'land', { castId: cast.id }, hooked.meterStartAt + 400)
  assert.equal(caught.status, 'caught')
  assert.ok(caught.fish.id && caught.fish.name)
  assert.deepEqual(caught.reward, { id: 'lily-pad', name: '小荷叶' })
  assert.equal(caught.state.catchCount, 1)
  assert.equal(caught.state.activeCast, null)
  assert.deepEqual(caught.state.collection, [
    { id: 'lily-pad', name: '小荷叶', count: 1 }
  ])
  assert.deepEqual(caught.state.fishBook, [{ ...caught.fish, count: 1 }])
  assert.throws(
    () => run(db, 'land', { castId: cast.id }, hooked.meterStartAt + 400),
    { code: 'CONFLICT' }
  )
  caught.state.collection[0].count = 100
  caught.state.fishBook[0].count = 100
  assert.equal(run(db, 'getState').collection[0].count, 1)
  assert.equal(run(db, 'getState').fishBook[0].count, 1)
})

test('只能佩戴自己已收集的装饰，重复佩戴不消耗，摘下与返回值互不串改', () => {
  const db = createSeed()
  assert.throws(() => run(db, 'equip', { decorationId: 'lily-pad' }), {
    code: 'FORBIDDEN'
  })
  catchOne(db)
  const equipped = run(db, 'equip', { decorationId: 'lily-pad' })
  assert.equal(equipped.equipped, 'lily-pad')
  equipped.collection[0].count = 0
  assert.equal(
    run(db, 'equip', { decorationId: 'lily-pad' }).collection[0].count,
    1
  )
  assert.equal(run(db, 'equip', { decorationId: null }).equipped, null)
  assert.throws(() => run(db, 'equip', { decorationId: 'reed-bow' }), {
    code: 'FORBIDDEN'
  })
  assert.throws(() => run(db, 'equip', { decorationId: 'paid-crown' }), {
    code: 'INVALID_ARGUMENT'
  })
})

test('标尺按同一完整周期往返，起步前不移动，正反向绿色区均可收线', () => {
  const meter = { meterStartAt: 1000, meterPeriodMs: 1600 }
  assert.equal(linePosition(meter, 900), 0)
  assert.equal(linePosition(meter, 1000), 0)
  assert.equal(linePosition(meter, 1400), 0.5)
  assert.equal(linePosition(meter, 1800), 1)
  assert.equal(linePosition(meter, 2200), 0.5)
  assert.equal(linePosition(meter, 2600), 0)
  for (const elapsed of [224, 624, 1200]) {
    const db = createSeed()
    const cast = run(db, 'cast')
    const hooked = run(db, 'hook', { castId: cast.id }, cast.biteAt).cast
    assert.equal(
      run(db, 'land', { castId: cast.id }, hooked.meterStartAt + elapsed)
        .status,
      'caught'
    )
  }
})

test('未提竿不能收线，收线过早、错区或过期时消费编号且无奖励', () => {
  for (const offset of [-1, 0, 800, 10001]) {
    const db = createSeed()
    const cast = run(db, 'cast')
    assert.throws(() => run(db, 'land', { castId: cast.id }), {
      code: 'CONFLICT'
    })
    const hooked = run(db, 'hook', { castId: cast.id }, cast.biteAt).cast
    const escaped = run(
      db,
      'land',
      { castId: cast.id },
      hooked.meterStartAt + offset
    )
    assert.equal(escaped.status, 'escaped')
    assert.ok(escaped.reason)
    assert.equal(escaped.state.activeCast, null)
    assert.equal(escaped.state.catchCount, 0)
    assert.deepEqual(escaped.state.collection, [])
    assert.throws(
      () => run(db, 'land', { castId: cast.id }, hooked.meterStartAt + 400),
      { code: 'CONFLICT' }
    )
  }
})

test('新抛竿立即作废旧编号，他人编号或客户端伪造时机与奖励不能发奖', () => {
  const db = createSeed()
  const stale = run(db, 'cast')
  const current = run(db, 'cast')
  assert.notEqual(stale.id, current.id)
  assert.throws(() => run(db, 'hook', { castId: stale.id }, stale.biteAt), {
    code: 'CONFLICT'
  })
  assert.equal(run(db, 'getState').activeCast.id, current.id)
  assert.throws(
    () =>
      dispatchFishing(
        db,
        'user_demo_b',
        'hook',
        { castId: current.id },
        { now: current.biteAt }
      ),
    { code: 'CONFLICT' }
  )
  for (const [action, params] of [
    ['getState', { userId: 'user_demo_b' }],
    ['cast', { reward: 'bubble-star' }],
    ['hook', { castId: current.id, success: true }],
    ['land', { castId: current.id, now: current.biteAt + 550 }],
    ['equip', { decorationId: 'lily-pad', ownerId: 'user_demo_b' }]
  ])
    assert.throws(() => run(db, action, params), { code: 'INVALID_ARGUMENT' })
  assert.equal(run(db, 'getState').catchCount, 0)
  assert.equal(run(db, 'getState').activeCast.id, current.id)
  const hooked = run(db, 'hook', { castId: current.id }, current.biteAt).cast
  const replacement = run(db, 'cast')
  assert.throws(
    () => run(db, 'land', { castId: hooked.id }, hooked.meterStartAt + 400),
    { code: 'CONFLICT' }
  )
  assert.equal(run(db, 'getState').activeCast.id, replacement.id)
})

test('后续成功按35%边界判定掉落，重复装饰累加，三件均可收集', () => {
  const db = createSeed()
  assert.equal(catchOne(db, () => 0.99).reward.id, 'lily-pad')
  assert.equal(catchOne(db, () => 0).reward.id, 'lily-pad')
  assert.equal(catchOne(db, () => 0.35).reward, null)
  let draws = [0.1, 0.3499, 0.5]
  assert.equal(catchOne(db, () => draws.shift()).reward.id, 'reed-bow')
  draws = [0.2, 0.1, 0.99]
  assert.equal(catchOne(db, () => draws.shift()).reward.id, 'bubble-star')
  const state = run(db, 'getState')
  assert.equal(state.catchCount, 5)
  assert.deepEqual(
    state.collection.map(({ id, count }) => ({ id, count })),
    [
      { id: 'lily-pad', count: 2 },
      { id: 'reed-bow', count: 1 },
      { id: 'bubble-star', count: 1 }
    ]
  )
  assert.equal(
    run(db, 'equip', { decorationId: 'bubble-star' }).equipped,
    'bubble-star'
  )
})

test('身份隔离及过期重读不遗留有效抛竿，未登录不得读取', () => {
  const db = createSeed()
  catchOne(db)
  run(db, 'equip', { decorationId: 'lily-pad' })
  const other = dispatchFishing(db, 'user_demo_b', 'getState')
  assert.equal(other.catchCount, 0)
  assert.equal(other.equipped, null)
  assert.deepEqual(other.collection, [])
  assert.throws(
    () =>
      dispatchFishing(db, 'user_demo_b', 'equip', { decorationId: 'lily-pad' }),
    { code: 'FORBIDDEN' }
  )
  const waiting = run(db, 'cast')
  assert.equal(run(db, 'getState', {}, waiting.escapeAt + 1).activeCast, null)
  const cast = run(db, 'cast')
  const hooked = run(db, 'hook', { castId: cast.id }, cast.escapeAt).cast
  assert.equal(
    run(db, 'getState', {}, hooked.landDeadlineAt + 1).activeCast,
    null
  )
  const saved = run(db, 'getState')
  assert.equal(saved.catchCount, 1)
  assert.equal(saved.equipped, 'lily-pad')
  assert.throws(() => dispatchFishing(db, 'missing', 'getState'), {
    code: 'UNAUTHENTICATED'
  })
})

test('新钓鱼掉落进入同一衣柜，旧装备API同步槽位且尊重新衣柜替换', () => {
  const db = createSeed()
  getWardrobeState(db, owner)
  catchOne(db)
  catchOne(db)
  assert.equal(
    getWardrobeState(db, owner).owned.find((item) => item.id === 'lily-pad')
      .count,
    2
  )
  assert.equal(
    getWardrobeState(db, owner).owned.find((item) => item.id === 'lily-pad')
      .count,
    2
  )
  run(db, 'equip', { decorationId: 'lily-pad' })
  assert.equal(getWardrobeState(db, owner).equipped.head, 'lily-pad')
  grantDiveReward(db, owner, 1)
  grantDiveReward(db, owner, 2)
  dispatchWardrobe(db, owner, 'redeem', { itemId: 'straw-hat' })
  dispatchWardrobe(db, owner, 'equip', { slot: 'head', itemId: 'straw-hat' })
  assert.equal(run(db, 'getState').equipped, null)
  run(db, 'equip', { decorationId: null })
  assert.equal(getWardrobeState(db, owner).equipped.head, 'straw-hat')
  run(db, 'equip', { decorationId: 'lily-pad' })
  let draws = [0.1, 0.1, 0.99]
  catchOne(db, () => draws.shift())
  run(db, 'equip', { decorationId: 'bubble-star' })
  const layered = getWardrobeState(db, owner)
  assert.equal(layered.equipped.head, 'lily-pad')
  assert.equal(layered.equipped.charm, 'bubble-star')
  run(db, 'equip', { decorationId: null })
  assert.equal(getWardrobeState(db, owner).equipped.head, null)
  assert.equal(getWardrobeState(db, owner).equipped.charm, null)
  assert.equal(run(db, 'getState').equipped, null)
})

test('珍珠先兑换旧饰品再钓鱼只累加新掉落，旧API的只读投影不会再次迁移', () => {
  const db = createSeed()
  grantDiveReward(db, owner, 1)
  dispatchWardrobe(db, owner, 'redeem', { itemId: 'lily-pad' })
  assert.equal(run(db, 'getState').collection[0].count, 1)
  assert.equal(
    run(db, 'equip', { decorationId: 'lily-pad' }).equipped,
    'lily-pad'
  )
  catchOne(db)
  assert.equal(run(db, 'getState').collection[0].count, 2)
  assert.equal(run(db, 'getState').collection[0].count, 2)
  catchOne(db, () => 0.99)
  assert.equal(
    getWardrobeState(db, owner).owned.find((item) => item.id === 'lily-pad')
      .count,
    2
  )
  assert.equal(getWardrobeState(db, owner).pearls, 5)
})
