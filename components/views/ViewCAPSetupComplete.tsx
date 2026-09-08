'use client'
import React, { useEffect, useMemo, useState } from 'react'

import ErrorBoundary from '@/app/error'
import { IDateRange } from '@lib/dateRange'
import {
  bucketByMonth,
  cumulativeByDay,
  IEnergyPoint,
  MONTH_NAMES,
  niceTicks,
  resolveUnit,
  windowDays,
} from '@lib/energySeries'

type TMeterData = {
  id: string
  type: string
  availableMeasures?: string[]
  location?: {
    ukPostcodeOutcode?: string
  }
}
interface IMetersData {
  data: TMeterData[]
}

type TMonthTick = {
  key: string
  label: string
  year?: string
  x: number
}

const CHART = {
  width: 720,
  height: 240,
  // Wider left gutter than the axis used to need, for tick labels plus the
  // rotated unit title; deeper bottom gutter for a month label plus a year.
  padding: { top: 20, right: 20, bottom: 36, left: 60 },
}
const PLOT_WIDTH = CHART.width - CHART.padding.left - CHART.padding.right
const PLOT_HEIGHT = CHART.height - CHART.padding.top - CHART.padding.bottom

/**
 * The axes, gridlines and labels shared by both charts. Marks are passed in as
 * children with their scaling already applied by the caller.
 */
const ChartFrame = ({
  children,
  monthTicks,
  unitLabel,
  yTicks,
}: {
  children: React.ReactNode
  monthTicks: TMonthTick[]
  unitLabel: string
  yTicks: number[]
}) => {
  const { padding } = CHART
  const topTick = yTicks[yTicks.length - 1] || 1
  const baseline = padding.top + PLOT_HEIGHT

  return (
    <svg
      height="240"
      viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      width="100%"
    >
      {yTicks.map(tick => {
        const y = baseline - (tick / topTick) * PLOT_HEIGHT
        return (
          <g key={`y-${tick}`}>
            <line
              stroke="#E5E7EB"
              x1={padding.left}
              x2={padding.left + PLOT_WIDTH}
              y1={y}
              y2={y}
            />
            <text
              fill="#6B7280"
              fontSize="10"
              textAnchor="end"
              x={padding.left - 6}
              y={y + 3}
            >
              {tick.toLocaleString('en-GB')}
            </text>
          </g>
        )
      })}
      <line
        stroke="#9CA3AF"
        x1={padding.left}
        x2={padding.left}
        y1={padding.top}
        y2={baseline}
      />
      <line
        stroke="#9CA3AF"
        x1={padding.left}
        x2={padding.left + PLOT_WIDTH}
        y1={baseline}
        y2={baseline}
      />
      {unitLabel ? (
        <text
          fill="#6B7280"
          fontSize="10"
          textAnchor="middle"
          transform={`rotate(-90 12 ${padding.top + PLOT_HEIGHT / 2})`}
          x={12}
          y={padding.top + PLOT_HEIGHT / 2}
        >
          {unitLabel}
        </text>
      ) : null}
      {monthTicks.map(tick => (
        <text
          fill="#6B7280"
          fontSize="10"
          key={`x-${tick.key}`}
          textAnchor="middle"
          x={tick.x}
          y={baseline + 14}
        >
          <tspan x={tick.x}>{tick.label}</tspan>
          {tick.year ? (
            <tspan dy="11" x={tick.x}>
              {tick.year}
            </tspan>
          ) : null}
        </text>
      ))}
      {children}
    </svg>
  )
}

const ViewCAPSetupComplete = () => {
  const [meterData, setMeterData] = useState<IMetersData | null>(null)
  const [data, setData] = useState<unknown>(null)
  const [range, setRange] = useState<IDateRange | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const response = await fetch('/api/getData')
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to load data')
        }
        const payload = (await response.json()) as {
          meterData?: unknown
          data?: unknown
          range?: IDateRange
        }
        if (!isMounted) return
        setMeterData((payload.meterData as IMetersData) ?? null)
        setData(payload.data ?? null)
        setRange(payload.range ?? null)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load data')
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const chartEntries = useMemo<IEnergyPoint[]>(() => {
    const payload = data as { data?: unknown } | null
    return Array.isArray(payload?.data) ? (payload?.data as IEnergyPoint[]) : []
  }, [data])

  const barChart = useMemo(() => {
    if (!range || chartEntries.length === 0) return null
    const { padding } = CHART
    const unit = resolveUnit(chartEntries, 'energy')
    const buckets = bucketByMonth(chartEntries, range).map(bucket => ({
      ...bucket,
      value: bucket.value * unit.scale,
    }))
    const max = buckets.reduce((highest, b) => Math.max(highest, b.value), 0)
    const yTicks = niceTicks(max)
    const topTick = yTicks[yTicks.length - 1] || 1
    const barWidth = PLOT_WIDTH / Math.max(buckets.length, 1)

    const monthTicks: TMonthTick[] = buckets.map((bucket, index) => ({
      key: bucket.key,
      label: MONTH_NAMES[bucket.month],
      // Year on the first bar and each January, so two calendar years in one
      // window cannot be confused.
      year:
        index === 0 || bucket.month === 0
          ? `’${String(bucket.year).slice(2)}`
          : undefined,
      x: padding.left + (index + 0.5) * barWidth,
    }))

    return (
      <ChartFrame
        monthTicks={monthTicks}
        unitLabel={unit.label}
        yTicks={yTicks}
      >
        {buckets.map((bucket, index) => {
          const barHeight = (bucket.value / topTick) * PLOT_HEIGHT
          return (
            <rect
              fill="#3B82F6"
              height={barHeight}
              key={`bar-${bucket.key}`}
              width={barWidth * 0.8}
              x={padding.left + index * barWidth + barWidth * 0.1}
              y={padding.top + PLOT_HEIGHT - barHeight}
            />
          )
        })}
      </ChartFrame>
    )
  }, [chartEntries, range])

  const lineChart = useMemo(() => {
    if (!range || chartEntries.length === 0) return null
    const { padding } = CHART
    const unit = resolveUnit(chartEntries, 'cumulative')
    const days = cumulativeByDay(chartEntries, range).map(day => ({
      ...day,
      value: day.value * unit.scale,
    }))
    if (days.length === 0) return null
    const totalDays = windowDays(range)
    const max = days.reduce((highest, day) => Math.max(highest, day.value), 0)
    const yTicks = niceTicks(max)
    const topTick = yTicks[yTicks.length - 1] || 1
    const xFor = (dayIndex: number) =>
      padding.left + (dayIndex / totalDays) * PLOT_WIDTH

    // The same month spine as the bars, so the two charts read against one
    // time axis; labels sit at the centre of each month's span.
    const buckets = bucketByMonth(chartEntries, range)
    const monthTicks: TMonthTick[] = buckets.map((bucket, index) => {
      const nextDayIndex = buckets[index + 1]?.dayIndex ?? totalDays
      return {
        key: bucket.key,
        label: MONTH_NAMES[bucket.month],
        year:
          index === 0 || bucket.month === 0
            ? `’${String(bucket.year).slice(2)}`
            : undefined,
        x: xFor((bucket.dayIndex + nextDayIndex) / 2),
      }
    })

    const points = days
      .map(
        day =>
          `${xFor(day.dayIndex)},${
            padding.top + PLOT_HEIGHT - (day.value / topTick) * PLOT_HEIGHT
          }`,
      )
      .join(' ')

    return (
      <ChartFrame
        monthTicks={monthTicks}
        unitLabel={unit.label}
        yTicks={yTicks}
      >
        <polyline
          fill="none"
          points={points}
          stroke="#10B981"
          strokeWidth={2}
        />
      </ChartFrame>
    )
  }, [chartEntries, range])

  return (
    <ErrorBoundary>
      <p>Setup complete</p>

      <div className="mt-4">
        <h2 className="mb-2 text-lg font-semibold">Meter details</h2>
        {meterData && meterData.data && meterData.data.length > 0 ? (
          <div className="flex-col gap-2 rounded border bg-gray-50 p-4">
            <p>
              <strong>ID:</strong> {meterData.data[0].id}
            </p>
            <p>
              <strong>TYPE:</strong> {meterData.data[0].type}
            </p>
            <p>
              <strong>LOCATION:</strong>{' '}
              {meterData.data[0].location?.ukPostcodeOutcode}
            </p>
          </div>
        ) : (
          <p>Retrieving your meter list.</p>
        )}
      </div>

      <div className="mt-4">
        <h2 className="mb-2 text-lg font-semibold">Energy data</h2>
        {data ? (
          <>
            {error ? (
              <p>Charts unavailable due to error.</p>
            ) : chartEntries.length === 0 ? (
              <p>
                No data returned
                {range ? ` for ${range.from} to ${range.to}` : ''}.
              </p>
            ) : (
              <>
                {range ? (
                  <p className="mb-4 text-sm text-gray-500">
                    {chartEntries.length.toLocaleString('en-GB')} half-hourly
                    readings from {range.from} to {range.to}.
                  </p>
                ) : null}
                <h3 className="font-semibold">Energy by month</h3>
                {barChart}
                <h3 className="mt-6 font-semibold">
                  Cumulative energy over the period
                </h3>
                {lineChart}
              </>
            )}
          </>
        ) : (
          <p>Retrieving your meter data…</p>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default ViewCAPSetupComplete
