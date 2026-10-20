import { call } from './transport.js'
export const list = (params = {}) => call('bulletin.list', params)
