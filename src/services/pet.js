import { call } from './transport.js'
import { config } from '../config/index.js'
import { ServiceError } from '../utils/errors.js'

export const get = () => call('pet.get')
export async function save(appearance) {
  if (config.apiMode !== 'mock' && appearance?.species === 'custom')
    throw new ServiceError(
      'NOT_IMPLEMENTED',
      '原创宠物暂不支持云端保存，当前修改尚未保存'
    )
  return call('pet.save', appearance)
}
