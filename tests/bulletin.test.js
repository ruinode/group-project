import test from 'node:test'
import assert from 'node:assert/strict'
import { dispatch } from '../src/mock/engine.js'
import { createSeed } from '../src/mock/seed.js'
import * as announcements from '../src/mock/bulletin.js'

test('公告以明确演示标记分页返回，调用方修改不污染后续读取', () => {
  const db = createSeed()
  const first = dispatch(db, 'bulletin.list', { pageSize: 1 })
  assert.equal(first.items.length, 1)
  assert.ok(first.nextCursor)
  assert.equal(first.items[0].demo, true)
  const title = first.items[0].title
  first.items[0].title = '篡改'
  assert.equal(dispatch(db, 'bulletin.list').items[0].title, title)
  const rest = dispatch(db, 'bulletin.list', { cursor: first.nextCursor })
  assert.ok(rest.items.length > 0)
  assert.ok(
    rest.items.every(
      (item) => item.demo && item.body && item.id !== first.items[0].id
    )
  )
  assert.equal(rest.nextCursor, null)
})

test('公告遵循统一身份入口，未登录时不伪造成功', () => {
  const db = createSeed()
  db.currentUserId = 'missing'
  assert.throws(() => dispatch(db, 'bulletin.list'), {
    code: 'UNAUTHENTICATED'
  })
})

test('演示校园活动按北京时间跨年生成未来三天，具备时间地点组织方和参与方式', () => {
  const now = new Date('2026-12-31T23:30:00+08:00')
  const items = announcements.listDemoBulletins(now)
  assert.equal(items.length, 3)
  assert.deepEqual(
    items.map((item) => item.startAt),
    [
      '2027-01-01T17:00:00+08:00',
      '2027-01-02T12:00:00+08:00',
      '2027-01-03T17:30:00+08:00'
    ]
  )
  for (const item of items) {
    assert.equal(item.demo, true)
    assert.equal(item.kind, 'campus-activity')
    assert.ok(Date.parse(item.startAt) > now.getTime())
    assert.ok(Date.parse(item.endAt) > Date.parse(item.startAt))
    assert.ok(
      item.title &&
        item.body &&
        item.location &&
        item.organizer &&
        item.participation
    )
    assert.match(item.participation, /演示|虚构/)
  }
})

test('换日期读取只返回尚未结束的活动，返回值修改不污染后续列表', () => {
  const now = new Date('2028-02-28T23:59:59+08:00')
  const items = announcements.listDemoBulletins(now)
  assert.equal(items[0].startAt, '2028-02-29T17:00:00+08:00')
  assert.ok(items.every((item) => Date.parse(item.endAt) > now.getTime()))
  const title = items[0].title
  items[0].title = '伪造真实活动'
  items[0].demo = false
  const reread = announcements.listDemoBulletins(now)
  assert.equal(reread[0].title, title)
  assert.equal(reread[0].demo, true)
  assert.ok(reread.every((item) => item.startAt.startsWith('2028-')))
})
