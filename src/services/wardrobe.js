import { call } from './transport.js'

export const getState = (params = {}) => call('wardrobe.getState', params)
export const equip = (params = {}) => call('wardrobe.equip', params)
export const redeem = (params = {}) => call('wardrobe.redeem', params)
