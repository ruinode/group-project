import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { choosePetPng } from '../src/platform/pet-image.js'

function useUni(t, api) {
  const previous = globalThis.uni
  globalThis.uni = api
  t.after(() => {
    if (previous === undefined) delete globalThis.uni
    else globalThis.uni = previous
  })
}

test('取消选图只是放弃导入，不提示读取失败', async (t) => {
  useUni(t, {
    chooseImage: (options) =>
      options.fail({ errMsg: 'chooseImage:fail cancel' })
  })
  assert.equal(await choosePetPng(), null)
})

test('H5 原生 File 读取为 PNG 帧，并让图片解码接口确认选中的本地图片', async (t) => {
  const bytes = readFileSync(
    new URL('../src/static/tabs/home.png', import.meta.url)
  )
  useUni(t, {
    chooseImage: (options) => {
      assert.equal(options.count, 1)
      assert.deepEqual(options.sourceType, ['album'])
      options.success({
        tempFiles: [
          {
            path: 'blob:chosen-png',
            size: bytes.length,
            arrayBuffer: async () => Uint8Array.from(bytes).buffer
          }
        ],
        tempFilePaths: ['blob:chosen-png']
      })
    },
    getImageInfo: (options) => {
      assert.equal(options.src, 'blob:chosen-png')
      options.success({ width: 48, height: 48 })
    }
  })
  assert.deepEqual(await choosePetPng(), {
    type: 'png',
    data: `data:image/png;base64,${bytes.toString('base64')}`
  })
})

test('微信端读取用户选中的临时 PNG 文件，不依赖浏览器 File 或网络取图', async (t) => {
  const data = readFileSync(
    new URL('../src/static/tabs/home.png', import.meta.url)
  ).toString('base64')
  useUni(t, {
    chooseImage: (options) =>
      options.success({
        tempFiles: [{ path: 'wxfile://chosen.png', size: 315 }],
        tempFilePaths: ['wxfile://chosen.png']
      }),
    getFileSystemManager: () => ({
      readFile: (options) => {
        assert.equal(options.filePath, 'wxfile://chosen.png')
        assert.equal(options.encoding, 'base64')
        options.success({ data })
      }
    }),
    getImageInfo: (options) => options.success({ width: 48, height: 48 })
  })
  assert.deepEqual(await choosePetPng(), {
    type: 'png',
    data: `data:image/png;base64,${data}`
  })
})

test('无效格式、超限、读取失败和无法解码均明确报错，不产出可保存画面', async (t) => {
  const bytes = readFileSync(
    new URL('../src/static/tabs/home.png', import.meta.url)
  )
  let file,
    decodeFailure = false,
    width = 48
  useUni(t, {
    chooseImage: (options) =>
      options.success({ tempFiles: [file], tempFilePaths: [file.path] }),
    getImageInfo: (options) =>
      decodeFailure ? options.fail({}) : options.success({ width, height: 48 })
  })
  const validFile = () => ({
    path: 'blob:local-image',
    size: bytes.length,
    arrayBuffer: async () => Uint8Array.from(bytes).buffer
  })
  file = {
    ...validFile(),
    arrayBuffer: async () => new TextEncoder().encode('<svg></svg>').buffer
  }
  await assert.rejects(choosePetPng(), { code: 'INVALID_ARGUMENT' })
  file = {
    ...validFile(),
    size: 256 * 1024 + 1,
    arrayBuffer: async () => {
      throw new Error('不应读取超限文件')
    }
  }
  await assert.rejects(choosePetPng(), { code: 'INVALID_ARGUMENT' })
  file = {
    ...validFile(),
    arrayBuffer: async () => {
      throw new Error('文件已失效')
    }
  }
  await assert.rejects(choosePetPng(), { code: 'SERVICE_UNAVAILABLE' })
  file = validFile()
  decodeFailure = true
  await assert.rejects(choosePetPng(), { code: 'INVALID_ARGUMENT' })
  decodeFailure = false
  width = 513
  await assert.rejects(choosePetPng(), { code: 'INVALID_ARGUMENT' })
})

test('H5 无 File.arrayBuffer 时只读取选图产生的 blob，不请求外部图片链接', async (t) => {
  const bytes = readFileSync(
    new URL('../src/static/tabs/home.png', import.meta.url)
  )
  const previousFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = previousFetch
  })
  let path = 'blob:fallback-image'
  useUni(t, {
    chooseImage: (options) =>
      options.success({
        tempFiles: [{ path, size: bytes.length }],
        tempFilePaths: [path]
      }),
    getImageInfo: (options) => options.success({ width: 48, height: 48 })
  })
  globalThis.fetch = async (url) => {
    assert.equal(url, 'blob:fallback-image')
    return { ok: true, arrayBuffer: async () => Uint8Array.from(bytes).buffer }
  }
  assert.equal((await choosePetPng()).type, 'png')
  path = 'https://example.com/pet.png'
  await assert.rejects(choosePetPng(), { code: 'NOT_SUPPORTED' })
})
