import {
  clonePet,
  defaultPet,
  validateAppearance
} from '../utils/pet-appearance.js'
import { requireThat } from '../utils/errors.js'

export function getPet(db, currentUserId, params = {}) {
  requireThat(
    params &&
      typeof params === 'object' &&
      !Array.isArray(params) &&
      Reflect.ownKeys(params).length === 0,
    'INVALID_ARGUMENT',
    '只能读取当前账号的宠物，无需提供身份或其他参数'
  )
  return clonePet(db.petAppearances?.[currentUserId] || defaultPet())
}

export function savePet(db, currentUserId, input) {
  const appearance = validateAppearance(input)
  db.petAppearances ||= {}
  db.petAppearances[currentUserId] = appearance
  return clonePet(appearance)
}
