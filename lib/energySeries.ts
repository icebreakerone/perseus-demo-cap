/**
 * Aggregation of the EDP's half-hourly readings into the series the CAP demo
 * charts.
 *
 * The resource API has no granularity parameter: a year is always returned as
 * 365 x 48 = 17,520 half-hourly readings, so rolling them up is the client's
 * job. Everything here works in UTC - the window, the month spine, the day
 * spine and the labels - because the readings carry Z-suffixed timestamps and
 * mixing in local months is how off-by-one-month bugs happen.
 *
 * Kept free of framework imports for the same reasons as lib/dateRange.
 */

import type { IDateRange } from './dateRange'

export interface IEnergyPoint {
  /** Interval start. */
  from: string
  /** Interval end. */
  to: string
  takenAt: string
  energy: { value: number; unitCode: string }
  cumulative: { value: number; unitCode: string }
}

export interface IMonthBucket {
  /** YYYY-MM, UTC. */
  key: string
  year: number
  /** 0-11. */
  month: number
  /** Summed energy for the month, in raw source units. */
  value: number
  /** Days from the window start to the first of this month; the x spine. */
  dayIndex: number
}

export interface IDayPoint {
  /** Days from the window start; the x spine. */
  dayIndex: number
  /** The day's closing cumulative reading, in raw source units. */
  value: number
}

export interface IUnit {
  /** Axis label, empty when the source units are unusable. */
  label: string
  /** Multiplier taking raw values into label units. */
  scale: number
}

const MS_PER_DAY = 86_400_000

/**
 * Fixed rather than toLocaleString, so axis labels do not vary with the
 * viewer's browser locale.
 */
export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const startOfWindow = (range: IDateRange) =>
  Date.parse(`${range.from}T00:00:00Z`)
const endOfWindow = (range: IDateRange) => Date.parse(`${range.to}T00:00:00Z`)

const monthKey = (year: number, month: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}`

/** Length of the requested window in whole days. */
export const windowDays = (range: IDateRange) =>
  Math.max(
    1,
    Math.round((endOfWindow(range) - startOfWindow(range)) / MS_PER_DAY),
  )

/**
 * Sum energy into calendar months.
 *
 * Bucketed on `from`, the interval start. `to` is the interval end, so the
 * 23:30-00:00 reading on 31 December carries to=2026-01-01T00:00:00Z and would
 * land in January; and `takenAt` changed meaning in the release that made this
 * window possible (it now falls one interval after `to` rather than at the
 * interval midpoint), so it is the wrong field to depend on.
 *
 * The spine comes from the requested window rather than the data's own extent,
 * so every month is present and in order whatever comes back.
 */
export const bucketByMonth = (
  points: IEnergyPoint[],
  range: IDateRange,
): IMonthBucket[] => {
  const totals = new Map<string, number>()
  for (const point of points) {
    const start = new Date(point.from)
    if (Number.isNaN(start.getTime())) continue
    const key = monthKey(start.getUTCFullYear(), start.getUTCMonth())
    totals.set(key, (totals.get(key) ?? 0) + Number(point.energy?.value ?? 0))
  }

  const windowStart = startOfWindow(range)
  const windowEnd = endOfWindow(range)
  const first = new Date(windowStart)
  const buckets: IMonthBucket[] = []
  const cursor = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1),
  )
  // `to` is exclusive, so a window ending on the 1st stops at the previous
  // month, while one ending mid-month still includes that partial month.
  while (cursor.getTime() < windowEnd) {
    const year = cursor.getUTCFullYear()
    const month = cursor.getUTCMonth()
    buckets.push({
      key: monthKey(year, month),
      year,
      month,
      value: totals.get(monthKey(year, month)) ?? 0,
      dayIndex: Math.round((cursor.getTime() - windowStart) / MS_PER_DAY),
    })
    cursor.setUTCMonth(month + 1)
  }
  return buckets
}

/**
 * The closing cumulative reading for each UTC day.
 *
 * `cumulative` is a running total, so it is sampled rather than summed. The
 * resource API restarts it from zero on every response, so it needs no
 * rebasing: the series already reads as consumption over the shared period.
 */
export const cumulativeByDay = (
  points: IEnergyPoint[],
  range: IDateRange,
): IDayPoint[] => {
  const windowStart = startOfWindow(range)
  const closing = new Map<number, { at: number; value: number }>()

  for (const point of points) {
    const at = Date.parse(point.from)
    if (Number.isNaN(at)) continue
    const dayIndex = Math.floor((at - windowStart) / MS_PER_DAY)
    const existing = closing.get(dayIndex)
    if (!existing || at > existing.at)
      closing.set(dayIndex, {
        at,
        value: Number(point.cumulative?.value ?? 0),
      })
  }

  return Array.from(closing.entries())
    .sort(([a], [b]) => a - b)
    .map(([dayIndex, reading]) => ({ dayIndex, value: reading.value }))
}

/**
 * How to label and scale an axis for the units the EDP actually sent.
 *
 * A month of electricity in WHR runs to seven figures, which will not fit the
 * axis gutter, so watt hours are shown as kWh. Mixed units are an upstream bug:
 * the values are summed unconverted and the label dropped rather than asserting
 * a unit the numbers do not share.
 */
export const resolveUnit = (
  points: IEnergyPoint[],
  field: 'energy' | 'cumulative',
): IUnit => {
  const codes = Array.from(
    new Set(points.map(point => point[field]?.unitCode).filter(Boolean)),
  )
  if (codes.length > 1) {
    console.warn(
      `Mixed unit codes in ${field} readings (${codes.join(', ')}); values are shown unconverted.`,
    )
    return { label: '', scale: 1 }
  }
  switch (codes[0]) {
    case 'WHR':
      return { label: 'kWh', scale: 0.001 }
    case 'KWH':
      return { label: 'kWh', scale: 1 }
    case 'MTQ':
      return { label: 'm³', scale: 1 }
    default:
      return { label: codes[0] ?? '', scale: 1 }
  }
}

/**
 * Axis ticks on a 1/2/5 x 10^n step, so the scale reads 0, 500, 1000, 1500
 * rather than 0 and 1405.44. The last tick is at or above `max`, and scaling
 * the plot to it keeps the tallest bar off the frame.
 */
export const niceTicks = (max: number, count = 4): number[] => {
  if (!(max > 0)) return [0]
  const rough = max / count
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = ([1, 2, 5].find(m => m * magnitude >= rough) ?? 10) * magnitude
  // Built by multiplication rather than repeated addition so a fractional step
  // cannot accumulate rounding error along the axis.
  const steps = Math.ceil(max / step)
  return Array.from({ length: steps + 1 }, (_, index) => index * step)
}
