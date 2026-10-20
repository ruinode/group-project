import test from 'node:test'
import assert from 'node:assert/strict'
import { createSeed } from '../src/mock/seed.js'
import { dispatch } from '../src/mock/engine.js'

test('搭子按关键词、完整类别和状态先筛选再分页，翻页不漏掉后续匹配', () => {
  const db = createSeed()
  const reference = db.contents.plan[0]
  const created = Array.from({ length: 7 }, (_, index) =>
    dispatch(db, 'plan.create', {
      title: `周末羽毛球 ${index + 1}`,
      body: '想找同学一起打球',
      category: '羽毛球',
      location: '体育馆',
      images: [],
      startAt: reference.startAt,
      endAt: reference.endAt,
      capacity: 2
    })
  )
  dispatch(db, 'plan.close', { id: created[0].id })
  const params = {
    keyword: '周末',
    category: '羽毛球',
    status: 'open',
    pageSize: 2
  }
  const result = []
  let cursor = null
  do {
    const page = dispatch(db, 'plan.list', { ...params, cursor })
    result.push(...page.items)
    cursor = page.nextCursor
  } while (cursor)
  assert.equal(result.length, 6)
  assert.deepEqual(
    result.map((item) => item.id).sort(),
    created
      .slice(1)
      .map((item) => item.id)
      .sort()
  )
  assert.equal(
    dispatch(db, 'plan.list', { ...params, status: 'closed' }).items[0].id,
    created[0].id
  )
  assert.equal(
    dispatch(db, 'plan.list', { ...params, category: '羽毛' }).items.length,
    0
  )
})

test('技能求助发布后可按自定义技能查询，完成状态与公开主页均保留同一条内容', () => {
  const db = createSeed()
  const item = dispatch(db, 'help.create', {
    title: '求助讲解 Python 列表',
    body: '希望一起练习基础题',
    category: 'Python',
    location: '图书馆',
    images: []
  })
  assert.equal(
    dispatch(db, 'help.list', { category: 'Python', status: 'open' }).items[0]
      .id,
    item.id
  )
  dispatch(db, 'help.complete', { id: item.id })
  assert.equal(
    dispatch(db, 'help.list', { category: 'Python', status: 'open' }).items
      .length,
    0
  )
  assert.equal(
    dispatch(db, 'help.list', {
      keyword: '基础题',
      category: 'Python',
      status: 'completed'
    }).items[0].id,
    item.id
  )
  const published = dispatch(db, 'user.listPublicContent', {
    userId: 'user_demo_a'
  })
  assert.ok(
    published.items.some(
      (content) => content.id === item.id && content.status === 'completed'
    )
  )
})
