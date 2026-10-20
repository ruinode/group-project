import test from 'node:test'
import assert from 'node:assert/strict'
import { inflateSync, deflateSync, crc32 } from 'node:zlib'
import {
  ART_SIZE,
  ART_COLORS,
  blankFrame,
  validateArtFrame,
  artFrameSource,
  pngDataFromBytes
} from '../src/utils/pet-art.js'

test('空画布独立，空背面可省略，非空正面校验后不与草稿串改', () => {
  const first = blankFrame()
  const second = blankFrame()
  assert.equal(ART_SIZE, 32)
  assert.equal(ART_COLORS.length, 16)
  assert.equal(first.pixels.length, 1024)
  assert.equal(validateArtFrame(null), null)
  assert.equal(validateArtFrame(first), null)
  assert.equal(artFrameSource(first), '')
  assert.throws(() => validateArtFrame(first, { required: true }), {
    code: 'INVALID_ARGUMENT'
  })
  first.pixels[0] = '#fff9e8'
  const saved = validateArtFrame(first, { required: true })
  first.pixels[0] = null
  assert.equal(saved.pixels[0], '#fff9e8')
  assert.equal(second.pixels[0], null)
})

test('像素图导出真实32×32透明PNG，可由独立zlib解码出准确RGBA', () => {
  const frame = blankFrame()
  frame.pixels[0] = '#fff9e8'
  frame.pixels[33] = '#4b4036'
  const source = artFrameSource(frame)
  const bytes = Buffer.from(source.split(',')[1], 'base64')
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
  assert.equal(bytes.readUInt32BE(16), 32)
  assert.equal(bytes.readUInt32BE(20), 32)
  assert.equal(bytes[24], 8)
  assert.equal(bytes[25], 6)
  let offset = 8
  const parts = []
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset)
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    if (type === 'IDAT')
      parts.push(bytes.subarray(offset + 8, offset + 8 + length))
    offset += length + 12
  }
  const rgba = inflateSync(Buffer.concat(parts))
  assert.equal(rgba.length, 32 * (1 + 32 * 4))
  assert.deepEqual(
    [...rgba.subarray(0, 13)],
    [0, 255, 249, 232, 255, 0, 0, 0, 0, 0, 0, 0, 0]
  )
  assert.deepEqual([...rgba.subarray(130 + 4, 130 + 8)], [75, 64, 54, 255])
  assert.equal(artFrameSource(frame), source)
})

function pngChunk(type, data) {
  const payload = Buffer.concat([Buffer.from(type), data])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(payload))
  return Buffer.concat([length, payload, checksum])
}

function fixturePng({
  width = 1,
  height = 1,
  idat = deflateSync(Buffer.from([0, 255, 249, 232, 255])),
  tail = Buffer.alloc(0)
} = {}) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
    tail
  ])
}

test('PNG导入验证真实区块和CRC，接受独立编码PNG并返回独立画面', () => {
  const bytes = fixturePng()
  const data = pngDataFromBytes(bytes)
  assert.equal(data, 'data:image/png;base64,' + bytes.toString('base64'))
  assert.equal(
    pngDataFromBytes(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    ),
    data
  )
  const frame = { type: 'png', data }
  const result = validateArtFrame(frame, { required: true })
  assert.deepEqual(result, frame)
  assert.notEqual(result, frame)
  assert.equal(artFrameSource(frame), data)
})

test('拒绝伪造头部、损坏/截断PNG、错误尺寸和超额图片，不能只凭扩展名保存', () => {
  const damaged = fixturePng()
  damaged[45] ^= 1
  const invalid = [
    Buffer.alloc(80),
    fixturePng().subarray(0, 33),
    fixturePng().subarray(0, -1),
    fixturePng({ width: 0 }),
    fixturePng({ width: 513 }),
    fixturePng({ height: 513 }),
    fixturePng({ idat: Buffer.from([0, 0, 0, 0, 0, 0]) }),
    fixturePng({ tail: Buffer.from([0]) }),
    fixturePng({ tail: Buffer.alloc(256 * 1024) }),
    damaged
  ]
  for (const bytes of invalid) {
    assert.throws(() => pngDataFromBytes(bytes), { code: 'INVALID_ARGUMENT' })
    assert.throws(
      () =>
        validateArtFrame({
          type: 'png',
          data: 'data:image/png;base64,' + bytes.toString('base64')
        }),
      { code: 'INVALID_ARGUMENT' }
    )
  }
  for (const data of [
    'https://example.com/pet.png',
    'data:image/svg+xml;base64,PHN2Zz4=',
    'data:image/jpeg;base64,/9j/',
    'data:image/png;base64,?',
    'data:image/png;base64,YQ='
  ]) {
    assert.throws(() => validateArtFrame({ type: 'png', data }), {
      code: 'INVALID_ARGUMENT'
    })
  }
})

test('无效像素、稀疏画布、额外字段与未知类型被拒绝', () => {
  const colored = blankFrame()
  colored.pixels[1] = ART_COLORS[0]
  const bad = [
    {},
    [],
    'pixels',
    { type: 'pixels', pixels: [] },
    { type: 'pixels', pixels: Array(1024) },
    { type: 'pixels', pixels: [...colored.pixels], ownerId: 'someone' },
    { type: 'pixels', pixels: colored.pixels.map(() => '#000000') },
    { type: 'pixels', pixels: colored.pixels.map(() => 0) },
    { type: 'pixels', pixels: colored.pixels.map(() => '#FFF9E8') },
    { type: 'gif', data: 'anything' },
    { type: 'png', data: pngDataFromBytes(fixturePng()), extra: true }
  ]
  for (const frame of bad)
    assert.throws(() => validateArtFrame(frame), { code: 'INVALID_ARGUMENT' })
  assert.throws(() => validateArtFrame(null, { required: true }), {
    code: 'INVALID_ARGUMENT'
  })
})
