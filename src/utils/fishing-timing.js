// 一个周期从左到右再回到左侧；页面显示与服务判定共用同一标尺。
export function linePosition(cast, now) {
  const start = cast?.meterStartAt
  const period = cast?.meterPeriodMs
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(now) ||
    !Number.isFinite(period) ||
    period <= 0
  )
    return 0
  const phase = (Math.max(0, now - start) % period) / period
  return phase <= 0.5 ? phase * 2 : (1 - phase) * 2
}
