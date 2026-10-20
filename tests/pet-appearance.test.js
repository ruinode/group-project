import test from 'node:test'
import assert from 'node:assert/strict'
import { createSeed } from '../src/mock/seed.js'
import { dispatch } from '../src/mock/engine.js'
import * as appearance from '../src/utils/pet-appearance.js'
import { readFileSync } from 'node:fs'

const rabbit = {
  species: 'rabbit',
  palette: 'cream',
  feature: 'floppy',
  accessory: 'satchel',
  name: '糯糯'
}

test('宠物搭配保存后可重新读取，名字去空白且输入和结果互不串改', () => {
  const db = createSeed()
  const draft = { ...rabbit, name: '  桂花糯糯  ' }
  const saved = dispatch(db, 'pet.save', draft)
  assert.deepEqual(saved, { ...rabbit, name: '桂花糯糯' })
  draft.name = '修改草稿'
  saved.name = '修改返回值'
  const restored = dispatch(db, 'pet.get')
  assert.equal(restored.name, '桂花糯糯')
  restored.accessory = 'none'
  assert.equal(dispatch(db, 'pet.get').accessory, 'satchel')
})

test('旧存档返回独立默认兔子，切换账号不会读取或改写他人的宠物', () => {
  const db = createSeed()
  const original = dispatch(db, 'pet.get')
  assert.deepEqual(original, rabbit)
  original.name = '未保存的草稿'
  assert.deepEqual(dispatch(db, 'pet.get'), rabbit)
  dispatch(db, 'pet.save', { ...rabbit, name: '小林的兔子' })
  db.currentUserId = 'user_demo_b'
  assert.deepEqual(dispatch(db, 'pet.get'), rabbit)
  dispatch(db, 'pet.save', { ...rabbit, palette: 'sage', name: '小桃的兔子' })
  assert.equal(dispatch(db, 'pet.get').name, '小桃的兔子')
  db.currentUserId = 'user_demo_a'
  assert.equal(dispatch(db, 'pet.get').name, '小林的兔子')
  db.currentUserId = 'missing-user'
  assert.throws(() => dispatch(db, 'pet.get'), { code: 'UNAUTHENTICATED' })
})

test('无效搭配、名字与身份字段被拒绝，之前保存的宠物仍可读', () => {
  const db = createSeed()
  const saved = { ...rabbit, name: '🌷'.repeat(12) }
  dispatch(db, 'pet.save', saved)
  const invalidDrafts = [
    null,
    [],
    { ...rabbit, species: 'dragon' },
    { ...rabbit, palette: 'neon' },
    { ...rabbit, feature: 'round-cap' },
    { ...rabbit, accessory: 'crown' },
    { ...rabbit, name: '   ' },
    { ...rabbit, name: '🌷'.repeat(13) },
    { ...rabbit, name: '糯\n糯' },
    { ...rabbit, name: '糯\u0085糯' },
    { ...rabbit, name: '\t糯糯' },
    { ...rabbit, userId: 'user_demo_b' },
    { ...rabbit, ownerId: 'user_demo_b' },
    { ...rabbit, currentUserId: 'user_demo_b' },
    { ...rabbit, unexpected: true }
  ]
  for (const draft of invalidDrafts) {
    assert.throws(() => dispatch(db, 'pet.save', draft), {
      name: 'ServiceError',
      code: 'INVALID_ARGUMENT'
    })
    assert.deepEqual(dispatch(db, 'pet.get'), saved)
  }
  assert.throws(() => dispatch(db, 'pet.get', { userId: 'user_demo_b' }), {
    code: 'INVALID_ARGUMENT'
  })
})

test('换成其他物种会重设耳朵或帽型，保留颜色、配饰和名字且不改写草稿', () => {
  const draft = {
    ...rabbit,
    palette: 'lilac',
    accessory: 'flower',
    name: '春日散步'
  }
  const mushroom = appearance.changeSpecies(draft, 'mushroom')
  assert.deepEqual(mushroom, {
    species: 'mushroom',
    palette: 'lilac',
    feature: 'round-cap',
    accessory: 'flower',
    name: '春日散步'
  })
  assert.equal(draft.species, 'rabbit')
  assert.equal(draft.feature, 'floppy')
  for (const species of ['mushroom', 'capybara', 'rabbit', 'squirrel']) {
    const changed = appearance.changeSpecies(draft, species)
    assert.deepEqual(appearance.validateAppearance(changed), changed)
    const defaultValue = appearance.defaultPet(species)
    assert.equal(defaultValue.species, species)
    assert.deepEqual(appearance.validateAppearance(defaultValue), defaultValue)
    defaultValue.name = '本地草稿'
    assert.notEqual(appearance.defaultPet(species).name, '本地草稿')
  }
  assert.throws(() => appearance.changeSpecies(draft, 'dragon'), {
    code: 'INVALID_ARGUMENT'
  })
})

test('编辑名字尚未填完时仍能换形象，完整外观在保存时校验', () => {
  const draft = appearance.changeSpecies({ ...rabbit, name: '' }, 'capybara')
  assert.equal(draft.species, 'capybara')
  assert.equal(draft.feature, 'round')
  assert.equal(draft.name, '')
  assert.throws(() => dispatch(createSeed(), 'pet.save', draft), {
    code: 'INVALID_ARGUMENT'
  })
})

test('原创 PNG 保存后重读，正背面与账号分别独立，预设仍保持五字段', () => {
  const db = createSeed()
  const png = {
    type: 'png',
    data: `data:image/png;base64,${readFileSync(new URL('../src/static/tabs/home.png', import.meta.url)).toString('base64')}`
  }
  const draft = {
    species: 'custom',
    palette: 'cream',
    feature: 'art',
    accessory: 'none',
    name: '  小画家  ',
    art: { front: png, back: null }
  }
  const saved = dispatch(db, 'pet.save', draft)
  assert.equal(saved.name, '小画家')
  assert.equal(saved.art.front.data, png.data)
  draft.art.front.data = '修改输入'
  saved.art.front.data = '修改结果'
  const restored = dispatch(db, 'pet.get')
  assert.ok(restored.art.front.data.startsWith('data:image/png;base64,'))
  restored.art.front.data = '修改重读结果'
  assert.notEqual(dispatch(db, 'pet.get').art.front.data, '修改重读结果')
  db.currentUserId = 'user_demo_b'
  assert.deepEqual(dispatch(db, 'pet.get'), rabbit)
  dispatch(db, 'pet.save', rabbit)
  assert.equal(Object.hasOwn(dispatch(db, 'pet.get'), 'art'), false)
  db.currentUserId = 'user_demo_a'
  assert.equal(dispatch(db, 'pet.get').name, '小画家')
})

test('原创像素正背面保存后深度隔离，编辑草稿或读取结果不会改写已保存画稿', () => {
  const db = createSeed()
  const draft = appearance.defaultCustomPet()
  assert.throws(() => dispatch(db, 'pet.save', draft), {
    code: 'INVALID_ARGUMENT'
  })
  draft.art.front.pixels[520] = '#456957'
  draft.art.back = appearance.clonePet(draft).art.front
  draft.art.back.pixels[520] = '#f4d779'
  const saved = dispatch(db, 'pet.save', draft)
  draft.art.front.pixels[520] = null
  saved.art.back.pixels[520] = null
  const restored = dispatch(db, 'pet.get')
  assert.equal(restored.art.front.pixels[520], '#456957')
  assert.equal(restored.art.back.pixels[520], '#f4d779')
  restored.art.front.pixels[520] = '#ffffff'
  assert.equal(dispatch(db, 'pet.get').art.front.pixels[520], '#456957')
  db.currentUserId = 'user_demo_b'
  const other = appearance.defaultCustomPet()
  other.art.front.pixels[0] = '#ffffff'
  dispatch(db, 'pet.save', other)
  assert.equal(dispatch(db, 'pet.get').art.front.pixels[520], null)
  db.currentUserId = 'user_demo_a'
  assert.equal(dispatch(db, 'pet.get').art.front.pixels[520], '#456957')
})

test('原创外观严格拒绝多余字段和错误画稿，失败时不覆盖之前保存的预设', () => {
  const db = createSeed()
  dispatch(db, 'pet.save', rabbit)
  const valid = appearance.defaultCustomPet()
  valid.art.front.pixels[0] = '#456957'
  const invalidDrafts = [
    Object.create(valid),
    { ...valid, palette: 'sage' },
    { ...valid, accessory: 'scarf' },
    { ...valid, feature: 'floppy' },
    { ...valid, ownerId: 'user_demo_b' },
    { ...valid, art: { ...valid.art, ownerId: 'user_demo_b' } },
    { ...valid, art: { front: valid.art.front } },
    {
      ...valid,
      art: {
        front: { type: 'png', data: 'https://example.com/pet.png' },
        back: null
      }
    },
    {
      ...valid,
      art: { front: { type: 'pixels', pixels: ['#456957'] }, back: null }
    },
    { ...rabbit, art: valid.art }
  ]
  for (const draft of invalidDrafts) {
    assert.throws(() => dispatch(db, 'pet.save', draft), {
      code: 'INVALID_ARGUMENT'
    })
    assert.deepEqual(dispatch(db, 'pet.get'), rabbit)
  }
})

test('原创草稿切回预设会去除画稿，保留名字并恢复该物种的有效默认搭配', () => {
  const draft = appearance.defaultCustomPet()
  draft.name = '  云朵  '
  const changed = appearance.changeSpecies(draft, 'rabbit')
  assert.deepEqual(changed, { ...rabbit, name: '  云朵  ' })
  assert.equal(appearance.validateAppearance(changed).name, '云朵')
  assert.ok(draft.art.front.pixels.every((pixel) => pixel === null))
  const cloned = appearance.clonePet(draft)
  cloned.art.front.pixels[0] = '#456957'
  assert.equal(draft.art.front.pixels[0], null)
})
