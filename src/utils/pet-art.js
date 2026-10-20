import { ServiceError } from './errors.js'

export const ART_SIZE = 32
export const ART_COLORS = Object.freeze([
  '#fff9e8',
  '#ffffff',
  '#e9c997',
  '#d49c6a',
  '#996d4b',
  '#4b4036',
  '#adc79b',
  '#6d9268',
  '#456957',
  '#f0b4ad',
  '#ca7e83',
  '#f4d779',
  '#c8b4d8',
  '#8c79ad',
  '#9fc6cf',
  '#5e8c9e'
])

const MAX_PNG_BYTES = 256 * 1024
const PREFIX = 'data:image/png;base64,'
const BASE64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]
const sourceCache = new WeakMap()
const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value
  for (let bit = 0; bit < 8; bit++)
    crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  return crc >>> 0
})

function invalid(message) {
  throw new ServiceError('INVALID_ARGUMENT', message)
}

export function blankFrame() {
  return { type: 'pixels', pixels: Array(ART_SIZE * ART_SIZE).fill(null) }
}

export function validateArtFrame(frame, { required = false } = {}) {
  if (frame == null) {
    if (required) invalid('请先画出或导入宠物正面')
    return null
  }
  if (typeof frame !== 'object' || Array.isArray(frame))
    invalid('宠物画面格式无效')
  if (frame.type === 'pixels') {
    if (
      !onlyKeys(frame, ['type', 'pixels']) ||
      !Array.isArray(frame.pixels) ||
      frame.pixels.length !== ART_SIZE * ART_SIZE
    ) {
      invalid('像素画布必须为32×32格')
    }
    let occupied = false
    const pixels = Array.from(frame.pixels, (color) => {
      if (color !== null && !ART_COLORS.includes(color))
        invalid('像素颜色不在可用色板中')
      if (color !== null) occupied = true
      return color
    })
    if (!occupied) {
      if (required) invalid('请先画出或导入宠物正面')
      return null
    }
    return { type: 'pixels', pixels }
  }
  if (frame.type === 'png') {
    if (!onlyKeys(frame, ['type', 'data'])) invalid('导入图片包含不支持的字段')
    validatePng(decodePngData(frame.data))
    return { type: 'png', data: frame.data }
  }
  invalid('只支持像素画或PNG图片')
}

function onlyKeys(value, keys) {
  const own = Reflect.ownKeys(value)
  return own.length === keys.length && own.every((key) => keys.includes(key))
}

function encodeBase64(bytes) {
  const output = []
  for (let offset = 0; offset < bytes.length; offset += 3) {
    const a = bytes[offset]
    const b = bytes[offset + 1]
    const c = bytes[offset + 2]
    output.push(
      BASE64[a >>> 2],
      BASE64[((a & 3) << 4) | ((b || 0) >>> 4)],
      offset + 1 < bytes.length
        ? BASE64[((b & 15) << 2) | ((c || 0) >>> 6)]
        : '=',
      offset + 2 < bytes.length ? BASE64[c & 63] : '='
    )
  }
  return output.join('')
}

function decodePngData(data) {
  if (typeof data !== 'string' || !data.startsWith(PREFIX))
    invalid('请选择PNG图片，不支持外链或其他格式')
  const encoded = data.slice(PREFIX.length)
  if (encoded.length > Math.ceil(MAX_PNG_BYTES / 3) * 4)
    invalid('PNG图片不能超过256 KiB')
  if (
    !encoded.length ||
    encoded.length % 4 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      encoded
    )
  ) {
    invalid('PNG图片数据不完整')
  }
  const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0
  const bytes = new Uint8Array((encoded.length / 4) * 3 - padding)
  for (let offset = 0, target = 0; offset < encoded.length; offset += 4) {
    const value =
      (BASE64.indexOf(encoded[offset]) << 18) |
      (BASE64.indexOf(encoded[offset + 1]) << 12) |
      ((BASE64.indexOf(encoded[offset + 2]) & 63) << 6) |
      (BASE64.indexOf(encoded[offset + 3]) & 63)
    if (target < bytes.length) bytes[target++] = value >>> 16
    if (target < bytes.length) bytes[target++] = value >>> 8
    if (target < bytes.length) bytes[target++] = value
  }
  if (bytes.length > MAX_PNG_BYTES) invalid('PNG图片不能超过256 KiB')
  if (encodeBase64(bytes) !== encoded) invalid('PNG图片编码无效')
  return bytes
}

function read32(bytes, offset) {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  )
}

function crc32(bytes, start = 0, end = bytes.length) {
  let crc = 0xffffffff
  for (let offset = start; offset < end; offset++)
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[offset]) & 255]
  return (crc ^ 0xffffffff) >>> 0
}

// W3C PNG: signature, critical chunk ordering, IHDR and per-chunk CRC.
// Actual image decoding remains the platform image loader's responsibility.
function validatePng(bytes) {
  if (bytes.length > MAX_PNG_BYTES) invalid('PNG图片不能超过256 KiB')
  if (
    bytes.length < 57 ||
    !SIGNATURE.every((value, index) => bytes[index] === value)
  )
    invalid('文件不是有效的PNG图片')
  let offset = 8
  let header = null
  let palette = false
  let imageStarted = false
  let imageEnded = false
  let imageBytes = 0
  const zlibHead = []
  while (offset + 12 <= bytes.length) {
    const length = read32(bytes, offset)
    if (length > bytes.length - offset - 12) invalid('PNG图片内容被截断')
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8))
    if (!/^[A-Za-z]{2}[A-Z][A-Za-z]$/.test(type)) invalid('PNG图片区块无效')
    const start = offset + 8
    const end = start + length
    if (crc32(bytes, offset + 4, end) !== read32(bytes, end))
      invalid('PNG图片已损坏，请重新导入')
    if (!header && type !== 'IHDR') invalid('PNG图片缺少图像信息')
    if (type === 'IHDR') {
      if (header || offset !== 8 || length !== 13)
        invalid('PNG图片图像信息无效')
      const width = read32(bytes, start)
      const height = read32(bytes, start + 4)
      if (!width || !height || width > 512 || height > 512)
        invalid('PNG宽高须在1～512像素之间')
      const depth = bytes[start + 8]
      const color = bytes[start + 9]
      const depths = {
        0: [1, 2, 4, 8, 16],
        2: [8, 16],
        3: [1, 2, 4, 8],
        4: [8, 16],
        6: [8, 16]
      }
      if (
        !depths[color]?.includes(depth) ||
        bytes[start + 10] !== 0 ||
        bytes[start + 11] !== 0 ||
        bytes[start + 12] > 1
      ) {
        invalid('PNG图片格式不受支持')
      }
      header = { color, depth }
    } else if (type === 'PLTE') {
      if (
        palette ||
        imageStarted ||
        !length ||
        length > 768 ||
        length % 3 ||
        [0, 4].includes(header.color) ||
        (header.color === 3 && length / 3 > 2 ** header.depth)
      ) {
        invalid('PNG图片色板无效')
      }
      palette = true
    } else if (type === 'IDAT') {
      if (imageEnded || (header.color === 3 && !palette))
        invalid('PNG图片像素区块顺序无效')
      imageStarted = true
      imageBytes += length
      for (let i = start; i < end && zlibHead.length < 2; i++)
        zlibHead.push(bytes[i])
    } else if (type === 'IEND') {
      if (length || !imageStarted || imageBytes < 6 || end + 4 !== bytes.length)
        invalid('PNG图片内容不完整')
      const [cmf, flg] = zlibHead
      if (
        (cmf & 15) !== 8 ||
        cmf >>> 4 > 7 ||
        ((cmf << 8) | flg) % 31 ||
        flg & 32
      )
        invalid('PNG图片压缩信息无效')
      return
    } else {
      if (imageStarted) imageEnded = true
      if (type[0] === type[0].toUpperCase()) invalid('PNG包含不支持的图像区块')
    }
    offset = end + 4
  }
  invalid('PNG图片缺少完整像素或结束区块')
}

export function pngDataFromBytes(input) {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input
  if (!(bytes instanceof Uint8Array)) invalid('PNG图片数据无效')
  validatePng(bytes)
  return PREFIX + encodeBase64(bytes)
}

function write32(output, value) {
  output.push(
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255
  )
}

function chunk(type, data) {
  const output = []
  write32(output, data.length)
  for (let i = 0; i < type.length; i++) output.push(type.charCodeAt(i))
  output.push(...data)
  write32(output, crc32(output, 4))
  return output
}

function encodePixels(pixels) {
  const raw = []
  for (let y = 0; y < ART_SIZE; y++) {
    raw.push(0) // Each row uses PNG filter None.
    for (let x = 0; x < ART_SIZE; x++) {
      const color = pixels[y * ART_SIZE + x]
      if (color === null) raw.push(0, 0, 0, 0)
      else
        raw.push(
          parseInt(color.slice(1, 3), 16),
          parseInt(color.slice(3, 5), 16),
          parseInt(color.slice(5, 7), 16),
          255
        )
    }
  }
  const length = raw.length
  // A final uncompressed deflate block in a zlib stream works on H5 and WeChat.
  const compressed = [
    0x78,
    0x01,
    0x01,
    length & 255,
    length >>> 8,
    ~length & 255,
    (~length >>> 8) & 255,
    ...raw
  ]
  let a = 1
  let b = 0
  for (const byte of raw) {
    a = (a + byte) % 65521
    b = (b + a) % 65521
  }
  write32(compressed, ((b << 16) | a) >>> 0)
  const header = []
  write32(header, ART_SIZE)
  write32(header, ART_SIZE)
  header.push(8, 6, 0, 0, 0)
  return (
    PREFIX +
    encodeBase64([
      ...SIGNATURE,
      ...chunk('IHDR', header),
      ...chunk('IDAT', compressed),
      ...chunk('IEND', [])
    ])
  )
}

export function artFrameSource(frame) {
  if (frame == null) return ''
  // Frames emitted by the editor and service are immutable snapshots.
  if (sourceCache.has(frame)) return sourceCache.get(frame)
  const valid = validateArtFrame(frame)
  const source = !valid
    ? ''
    : valid.type === 'png'
      ? valid.data
      : encodePixels(valid.pixels)
  sourceCache.set(frame, source)
  return source
}
