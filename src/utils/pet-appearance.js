import { requireThat } from './errors.js'
import { blankFrame, validateArtFrame } from './pet-art.js'

export const speciesOptions = [
  { id: 'mushroom', name: '森芽菇', description: '顶着小伞，在树荫下慢慢走' },
  {
    id: 'capybara',
    name: '栗团水豚',
    description: '圆乎乎的散步伙伴，安静又自在'
  },
  { id: 'rabbit', name: '糯叶兔', description: '带着叶子包，收集校园的小惊喜' },
  {
    id: 'squirrel',
    name: '铃果松鼠',
    description: '翘起蓬松尾巴，轻快地去探险'
  }
]

export const paletteOptions = [
  {
    id: 'cream',
    label: '原色',
    color: '#eddeb8',
    shade: '#cbb383',
    ink: '#594b37',
    inner: '#dfa99a'
  },
  {
    id: 'sage',
    label: '苔绿',
    color: '#c7d1a2',
    shade: '#93a574',
    ink: '#48543c',
    inner: '#d3ab98'
  },
  {
    id: 'apricot',
    label: '杏桃',
    color: '#e5b88f',
    shade: '#bd8d67',
    ink: '#624936',
    inner: '#d99487'
  },
  {
    id: 'lilac',
    label: '淡紫',
    color: '#d3c6da',
    shade: '#aa96b6',
    ink: '#594c61',
    inner: '#d8a4b0'
  }
]

export const accessoryOptions = [
  { id: 'none', label: '不佩戴' },
  { id: 'scarf', label: '小围巾' },
  { id: 'satchel', label: '叶子包' },
  { id: 'flower', label: '小花' }
]

const featureOptions = {
  mushroom: [
    { id: 'round-cap', label: '圆伞' },
    { id: 'wide-cap', label: '宽伞' }
  ],
  capybara: [
    { id: 'round', label: '圆耳' },
    { id: 'perky', label: '立耳' }
  ],
  rabbit: [
    { id: 'floppy', label: '垂耳' },
    { id: 'upright', label: '立耳' },
    { id: 'short', label: '短耳' }
  ],
  squirrel: [
    { id: 'pointed', label: '尖耳' },
    { id: 'round', label: '圆耳' }
  ]
}

export const featuresFor = (species) =>
  Object.prototype.hasOwnProperty.call(featureOptions, species)
    ? featureOptions[species].map((option) => ({ ...option }))
    : []

const defaults = {
  mushroom: {
    species: 'mushroom',
    palette: 'sage',
    feature: 'round-cap',
    accessory: 'flower',
    name: '森森'
  },
  capybara: {
    species: 'capybara',
    palette: 'apricot',
    feature: 'round',
    accessory: 'scarf',
    name: '栗栗'
  },
  rabbit: {
    species: 'rabbit',
    palette: 'cream',
    feature: 'floppy',
    accessory: 'satchel',
    name: '糯糯'
  },
  squirrel: {
    species: 'squirrel',
    palette: 'apricot',
    feature: 'pointed',
    accessory: 'satchel',
    name: '铃铃'
  }
}

export function defaultPet(species = 'rabbit') {
  requireThat(
    Object.prototype.hasOwnProperty.call(defaults, species),
    'INVALID_ARGUMENT',
    '请选择有效的宠物形象'
  )
  return { ...defaults[species] }
}

export function changeSpecies(appearance, species) {
  const next = defaultPet(species)
  const fromCustom = appearance.species === 'custom'
  return {
    species: next.species,
    palette: fromCustom ? next.palette : appearance.palette,
    feature: next.feature,
    accessory: fromCustom ? next.accessory : appearance.accessory,
    name: appearance.name
  }
}

export function defaultCustomPet() {
  return {
    species: 'custom',
    palette: 'cream',
    feature: 'art',
    accessory: 'none',
    name: '新伙伴',
    art: { front: blankFrame(), back: null }
  }
}

export const clonePet = (appearance) => JSON.parse(JSON.stringify(appearance))

export function validateAppearance(input) {
  const fields = ['species', 'palette', 'feature', 'accessory', 'name']
  const custom = input?.species === 'custom'
  if (custom) fields.push('art')
  requireThat(
    input &&
      typeof input === 'object' &&
      !Array.isArray(input) &&
      Reflect.ownKeys(input).length === fields.length &&
      Reflect.ownKeys(input).every((key) => fields.includes(key)),
    'INVALID_ARGUMENT',
    '请只提供约定的宠物外观字段'
  )
  requireThat(
    custom
      ? input.palette === 'cream' &&
          input.feature === 'art' &&
          input.accessory === 'none'
      : speciesOptions.some((option) => option.id === input.species) &&
          paletteOptions.some((option) => option.id === input.palette) &&
          featuresFor(input.species).some(
            (option) => option.id === input.feature
          ) &&
          accessoryOptions.some((option) => option.id === input.accessory),
    'INVALID_ARGUMENT',
    '请选择有效的宠物搭配'
  )
  requireThat(
    typeof input.name === 'string' &&
      !/[\u0000-\u001f\u007f-\u009f]/u.test(input.name) &&
      Array.from(input.name.trim()).length >= 1 &&
      Array.from(input.name.trim()).length <= 12,
    'INVALID_ARGUMENT',
    '名字需为 1～12 个字符，且不能包含控制字符'
  )
  const appearance = {
    species: input.species,
    palette: input.palette,
    feature: input.feature,
    accessory: input.accessory,
    name: input.name.trim()
  }
  if (custom) {
    requireThat(
      input.art &&
        typeof input.art === 'object' &&
        !Array.isArray(input.art) &&
        Reflect.ownKeys(input.art).length === 2 &&
        Object.prototype.hasOwnProperty.call(input.art, 'front') &&
        Object.prototype.hasOwnProperty.call(input.art, 'back'),
      'INVALID_ARGUMENT',
      '原创宠物只接受正面和背面画稿'
    )
    appearance.art = {
      front: validateArtFrame(input.art.front, { required: true }),
      back: validateArtFrame(input.art.back)
    }
  }
  return appearance
}
