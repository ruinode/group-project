// 所有锚点都来自 144 × 176 的原画帧，不把四种身体当作同一个圆形。
// 这里只描述显示位置；物品归属、装备与数量仍由 wardrobe 服务决定。
const FRAME = { width: 144, height: 176 }
const box = (x, y, width, height, extra = {}) => ({
  x,
  y,
  width,
  height,
  ...extra
})

const bodies = {
  rabbit: {
    outfit: box(17, 119, 85, 43),
    feet: box(25, 150, 68, 20),
    shoes: [box(22, 150, 31, 20), box(64, 150, 31, 20)],
    ankles: [box(31, 154, 13, 8), box(73, 154, 13, 8)],
    hair: box(14, 55, 90, 50),
    head: box(16, 46, 88, 34),
    bag: box(70, 126, 28, 33),
    backpack: box(28, 117, 61, 44),
    rearBag: box(89, 123, 25, 35),
    straps: box(24, 124, 68, 32),
    hand: box(55, 71, 45, 62),
    charm: box(48, 139, 14, 16),
    chin: box(20, 107, 76, 17, { radius: '0 0 50% 50%' }),
    neck: box(47, 116, 25, 16),
    paws: [box(30, 120, 23, 17), box(66, 120, 24, 17)],
    ears: [box(7, 9, 47, 63), box(75, 53, 62, 54)]
  },
  capybara: {
    outfit: box(15, 100, 111, 61),
    feet: box(27, 148, 87, 22),
    shoes: [box(22, 148, 40, 22), box(80, 148, 40, 22)],
    ankles: [box(34, 152, 16, 9), box(92, 152, 16, 9)],
    hair: box(17, 29, 108, 54),
    head: box(17, 10, 109, 33),
    bag: box(91, 125, 31, 34),
    backpack: box(34, 102, 74, 54),
    rearBag: box(114, 118, 25, 39),
    straps: box(27, 109, 89, 46),
    hand: box(72, 61, 48, 68),
    charm: box(64, 134, 17, 19),
    chin: box(23, 86, 98, 22, { radius: '0 0 50% 50%' }),
    neck: box(56, 97, 31, 17),
    paws: [box(34, 108, 29, 25), box(81, 108, 30, 25)],
    ears: [box(27, 17, 28, 30), box(89, 17, 28, 30)]
  },
  mushroom: {
    outfit: box(30, 131, 69, 31),
    feet: box(39, 151, 52, 19),
    shoes: [box(38, 151, 23, 19), box(69, 151, 23, 19)],
    ankles: [box(44, 155, 11, 7), box(75, 155, 11, 7)],
    hair: box(29, 102, 73, 42),
    head: box(30, 50, 78, 31),
    bag: box(78, 141, 23, 24),
    backpack: box(42, 130, 46, 29),
    rearBag: box(92, 137, 22, 25),
    straps: box(35, 136, 59, 24),
    hand: box(62, 88, 38, 52),
    charm: box(59, 146, 12, 13),
    chin: box(39, 121, 54, 14, { radius: '0 0 50% 50%' }),
    neck: box(55, 126, 22, 13),
    paws: [box(42, 132, 19, 14), box(69, 132, 19, 14)],
    ears: []
  },
  squirrel: {
    outfit: box(65, 117, 69, 45),
    feet: box(61, 150, 69, 20),
    shoes: [box(58, 150, 32, 20), box(102, 150, 32, 20)],
    ankles: [box(67, 154, 14, 8), box(111, 154, 14, 8)],
    hair: box(57, 59, 82, 46),
    head: box(59, 48, 81, 33),
    bag: box(111, 136, 26, 27),
    backpack: box(89, 119, 40, 38),
    rearBag: box(128, 128, 20, 32),
    straps: box(74, 124, 58, 34),
    hand: box(100, 73, 42, 61),
    charm: box(97, 140, 13, 15),
    chin: box(62, 105, 72, 18, { radius: '0 0 50% 50%' }),
    neck: box(88, 113, 27, 18),
    paws: [box(78, 120, 21, 21), box(111, 120, 21, 21)],
    ears: [box(62, 13, 29, 57), box(107, 34, 28, 38)],
    tail: box(13, 88, 75, 77, { radius: '46% 48% 45% 42%' })
  },
  custom: {
    outfit: box(28, 106, 86, 49),
    feet: box(29, 150, 85, 19),
    shoes: [box(28, 150, 38, 19), box(77, 150, 38, 19)],
    ankles: [],
    hair: box(24, 30, 97, 56),
    head: box(27, 22, 90, 35),
    bag: box(91, 124, 29, 35),
    backpack: box(42, 106, 62, 47),
    rearBag: box(110, 117, 23, 39),
    straps: box(32, 106, 80, 49),
    hand: box(108, 56, 43, 76),
    charm: box(67, 132, 16, 18),
    chin: null,
    neck: null,
    paws: [],
    ears: []
  }
}

const move = (rect, dx = 0, dy = 0) =>
  rect && { ...rect, x: rect.x + dx, y: rect.y + dy }

export function wearableFitting(
  species = 'rabbit',
  feature = '',
  view = 'front'
) {
  const base = Object.prototype.hasOwnProperty.call(bodies, species)
    ? bodies[species]
    : bodies.custom
  const shift =
    species === 'rabbit' && ['upright', 'short'].includes(feature)
      ? 12
      : species === 'mushroom' && feature === 'wide-cap'
        ? 4
        : 0
  const fit = Object.fromEntries(
    Object.entries(base).map(([key, value]) => [
      key,
      Array.isArray(value)
        ? value.map((part) => move(part, shift))
        : move(value, shift)
    ])
  )
  if (species === 'rabbit' && feature === 'upright') {
    fit.ears = [box(25, 8, 40, 64), box(75, 9, 46, 62)]
  } else if (species === 'rabbit' && feature === 'short') {
    fit.ears = [box(31, 46, 31, 34), box(78, 47, 32, 32)]
  } else if (species === 'capybara' && feature === 'perky') {
    fit.ears = [box(21, 7, 34, 41), box(90, 7, 34, 41)]
  } else if (species === 'squirrel' && feature === 'round') {
    fit.ears = [box(61, 57, 28, 26), box(107, 54, 28, 27)]
  }
  fit.hairBrim = null
  if (view !== 'back') {
    const frontHair = {
      rabbit: box(-3, 43, 128, 80),
      capybara: box(-4, -6, 150, 100),
      mushroom: box(22, 88, 86, 43),
      squirrel: box(45, 47, 116, 78)
    }
    if (frontHair[species])
      fit.hair = move(
        frontHair[species],
        shift,
        species === 'mushroom' && feature === 'wide-cap' ? 3 : 0
      )
    if (species === 'mushroom')
      fit.hairBrim = box(
        11 + shift,
        feature === 'wide-cap' ? 91 : 88,
        111,
        20,
        { radius: '0 0 50% 50%' }
      )
  }
  if (view === 'back') {
    fit.chin = null
    fit.neck = null
    fit.paws = []
    if (species === 'rabbit') {
      fit.shoes = fit.shoes.map((part) => move(part, -1))
      fit.ankles = fit.ankles.map((part) => move(part, -1))
    } else if (species === 'capybara') {
      fit.shoes[1] = move(fit.shoes[1], 1)
      fit.ankles[1] = move(fit.ankles[1], 1)
    } else if (species === 'mushroom') {
      fit.shoes[0] = move(fit.shoes[0], 2)
      fit.ankles[0] = move(fit.ankles[0], 2)
      fit.shoes[1] = move(fit.shoes[1], -1)
      fit.ankles[1] = move(fit.ankles[1], -1)
    } else if (species === 'squirrel') {
      fit.shoes[0] = move(fit.shoes[0], 1)
      fit.ankles[0] = move(fit.ankles[0], 1)
    }
    if (species === 'squirrel') fit.backpack = box(92, 121, 37, 37)
  }
  return fit
}

export function wearableShoeBox(itemId, fit, index) {
  const part = fit.shoes[index]
  if (itemId === 'rain-boots')
    return box(part.x, part.y - 7, part.width, part.height + 7)
  if (itemId === 'leaf-slippers')
    return box(part.x, part.y + 2, part.width, part.height - 2)
  return part
}

export function wearableAnkleBox(itemId, fit, index) {
  const part = fit.ankles[index]
  if (!part) return null
  return itemId === 'rain-boots' ? move(part, 0, -6) : part
}

export function wearableBox(itemId, fit, view = 'front', art = null) {
  if (['sailor-shirt', 'moss-cape', 'coral-dress'].includes(itemId)) {
    const b = fit.outfit
    return itemId === 'coral-dress'
      ? box(b.x - 2, b.y, b.width + 4, b.height + 2)
      : b
  }
  if (itemId === 'legacy-scarf') {
    const width = fit.outfit.width * 0.68
    const height = (width * (art?.height || 95)) / (art?.width || 128)
    return box(
      fit.outfit.x + (fit.outfit.width - width) / 2,
      fit.outfit.y - 2,
      width,
      height
    )
  }
  if (['rain-boots', 'shell-shoes', 'leaf-slippers'].includes(itemId)) {
    const b = fit.feet
    return itemId === 'rain-boots'
      ? box(b.x, b.y - 7, b.width, b.height + 7)
      : itemId === 'leaf-slippers'
        ? box(b.x, b.y + 2, b.width, b.height - 2)
        : b
  }
  if (['acorn-bob', 'cloud-bun', 'sea-braid'].includes(itemId)) return fit.hair
  if (itemId === 'leaf-backpack')
    return view === 'back' ? fit.backpack : fit.rearBag
  if (['shell-pouch', 'bottle-bag', 'legacy-satchel'].includes(itemId))
    return fit.bag
  if (['tiny-net', 'clover-umbrella', 'star-wand'].includes(itemId)) {
    const b = fit.hand
    const width = itemId === 'clover-umbrella' ? b.width + 12 : b.width
    const height = itemId === 'clover-umbrella' ? b.height + 10 : b.height
    const grip = art?.grip || { x: 0.5, y: 0.96 }
    const paw = fit.paws[1]
    const targetX = paw ? paw.x + paw.width / 2 : b.x + b.width / 2
    const targetY = paw ? paw.y + paw.height / 2 : b.y + b.height * 0.96
    return box(
      targetX - width * grip.x,
      targetY - height * grip.y,
      width,
      height,
      {
        rotation:
          fit.hairBrim && ['clover-umbrella', 'star-wand'].includes(itemId)
            ? 55
            : 39,
        origin: `${grip.x * 100}% ${grip.y * 100}%`
      }
    )
  }
  if (
    ['bubble-star', 'pearl-badge', 'clover-pin', 'glow-jelly'].includes(itemId)
  ) {
    const b = fit.charm
    return itemId === 'glow-jelly'
      ? box(b.x, b.y - 1, b.width, b.height + 5)
      : b
  }
  const b = fit.head
  if (itemId === 'lily-pad')
    return box(
      b.x + b.width * 0.27,
      b.y + b.height * 0.36,
      b.width * 0.44,
      b.height * 0.48
    )
  if (itemId === 'reed-bow')
    return box(
      b.x + b.width * 0.65,
      b.y + b.height * 0.44,
      b.width * 0.31,
      b.height * 0.66
    )
  if (itemId === 'legacy-flower')
    return box(
      b.x + b.width * 0.76,
      b.y + b.height * 0.56,
      b.width * 0.27,
      b.height * 0.69
    )
  if (itemId === 'shell-crown')
    return box(
      b.x + b.width * 0.13,
      b.y + b.height * 0.12,
      b.width * 0.76,
      b.height * 0.82
    )
  return b
}

export function wearableBoxStyle(rect) {
  if (!rect) return {}
  return {
    left: `${(rect.x / FRAME.width) * 100}%`,
    top: `${(rect.y / FRAME.height) * 100}%`,
    width: `${(rect.width / FRAME.width) * 100}%`,
    height: `${(rect.height / FRAME.height) * 100}%`,
    ...(rect.rotation
      ? {
          transform: `rotate(${rect.rotation}deg)`,
          transformOrigin: rect.origin || '50% 50%'
        }
      : {})
  }
}

export function bodyPartCopyStyle(rect) {
  return {
    left: `${(-rect.x / rect.width) * 100}%`,
    top: `${(-rect.y / rect.height) * 100}%`,
    width: `${(FRAME.width / rect.width) * 100}%`,
    height: `${(FRAME.height / rect.height) * 100}%`
  }
}
