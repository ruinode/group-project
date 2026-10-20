import { call } from './transport.js'

export const getState = (params = {}) => call('fishing.getState', params)
export const cast = (params = {}) => call('fishing.cast', params)
export const hook = (params = {}) => call('fishing.hook', params)
export const land = (params = {}) => call('fishing.land', params)
export const equip = (params = {}) => call('fishing.equip', params)
