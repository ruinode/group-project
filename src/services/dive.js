import { call } from './transport.js'

export const getState = (params = {}) => call('dive.getState', params)
export const start = (params = {}) => call('dive.start', params)
export const finish = (params = {}) => call('dive.finish', params)
