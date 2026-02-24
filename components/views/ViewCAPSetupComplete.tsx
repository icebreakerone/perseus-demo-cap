'use client'
import React, { useEffect, useMemo, useState } from 'react'

import ErrorBoundary from '@/app/error'

interface IProps {
  children: React.ReactElement
}

type EnergyPoint = {
  from: string
  to: string
  takenAt: string
  energy: { value: number; unitCode: string }
  cumulative: { value: number; unitCode: string }
}

type TMeterData = {
  id: string
  type: string
  location?: {
    ukPostcodeOutcode?: string
  }
}
interface IMetersData {
  data: [TMeterData]
}

const ViewCAPSetupComplete = ({ children }: IProps) => {
  const [meterData, setMeterData] = useState<IMetersData | null>(null)
  const [data, setData] = useState<unknown>(null)
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
        }
        console.log('ViewCAPSetupComplete # Data loaded successfully:', payload)
        if (!isMounted) return
        setMeterData((payload.meterData as IMetersData) ?? null)
        setData(payload.data ?? null)
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

  const chartEntries = useMemo<EnergyPoint[]>(() => {
    const payload = data as { data?: unknown } | null
    return Array.isArray(payload?.data) ? (payload?.data as EnergyPoint[]) : []
  }, [data])

  const chartConfig = useMemo(() => {
    const width = 720
    const height = 240
    const padding = { top: 20, right: 20, bottom: 30, left: 48 }
    const plotWidth = width - padding.left - padding.right
    const plotHeight = height - padding.top - padding.bottom

    const energyValues = chartEntries.map(entry =>
      Number(entry.energy?.value ?? 0),
    )
    const cumulativeValues = chartEntries.map(entry =>
      Number(entry.cumulative?.value ?? 0),
    )
    const maxEnergy = Math.max(0, ...energyValues)
    const maxCumulative = Math.max(0, ...cumulativeValues)

    const xMinLabel = chartEntries[0]?.from
    const xMaxLabel = chartEntries[chartEntries.length - 1]?.to

    return {
      width,
      height,
      padding,
      plotWidth,
      plotHeight,
      energyValues,
      cumulativeValues,
      maxEnergy,
      maxCumulative,
      xMinLabel,
      xMaxLabel,
    }
  }, [chartEntries])

  const formatTimeDate = (isoString?: string) => {
    if (!isoString) return { date: '', time: '' }
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return { date: '', time: '' }
    const iso = date.toISOString()
    return {
      time: iso.slice(11, 16),
      date: iso.slice(0, 10),
    }
  }

  const timeLabel = (isoString: string) => {
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(11, 16)
  }

  const barChartSvg = useMemo(() => {
    const {
      width,
      height,
      padding,
      plotWidth,
      plotHeight,
      energyValues,
      maxEnergy,
      xMinLabel,
      xMaxLabel,
    } = chartConfig
    const barCount = Math.max(energyValues.length, 1)
    const barWidth = plotWidth / barCount

    return (
      <svg height="240" viewBox={`0 0 ${width} ${height}`} width="100%">
        <line
          stroke="#9CA3AF"
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={padding.top + plotHeight}
        />
        <line
          stroke="#9CA3AF"
          x1={padding.left}
          x2={padding.left + plotWidth}
          y1={padding.top + plotHeight}
          y2={padding.top + plotHeight}
        />
        <text
          fill="#6B7280"
          fontSize="10"
          textAnchor="end"
          x={padding.left - 6}
          y={padding.top + 4}
        >
          {maxEnergy.toFixed(0)}
        </text>
        <text
          fill="#6B7280"
          fontSize="10"
          textAnchor="end"
          x={padding.left - 6}
          y={padding.top + plotHeight}
        >
          0
        </text>
        <text
          fill="#6B7280"
          fontSize="10"
          textAnchor="start"
          x={padding.left}
          y={padding.top + plotHeight + 14}
        >
          <tspan dy="0" x={padding.left}>
            {formatTimeDate(xMinLabel).time}
          </tspan>
          <tspan dy="12" x={padding.left}>
            {formatTimeDate(xMinLabel).date}
          </tspan>
        </text>
        <text
          fill="#6B7280"
          fontSize="10"
          textAnchor="end"
          x={padding.left + plotWidth}
          y={padding.top + plotHeight + 14}
        >
          <tspan dy="0" x={padding.left + plotWidth}>
            {formatTimeDate(xMaxLabel).time}
          </tspan>
          <tspan dy="12" x={padding.left + plotWidth}>
            {formatTimeDate(xMaxLabel).date}
          </tspan>
        </text>
        {energyValues.map((value, index) => {
          const safeMax = maxEnergy || 1
          const barHeight = (value / safeMax) * plotHeight
          const x = padding.left + index * barWidth + barWidth * 0.1
          const y = padding.top + plotHeight - barHeight
          const w = barWidth * 0.8
          return (
            <rect
              fill="#3B82F6"
              height={barHeight}
              key={`bar-${index}`}
              width={w}
              x={x}
              y={y}
            />
          )
        })}
      </svg>
    )
  }, [chartConfig])

  const lineChartSvg = useMemo(() => {
    const {
      width,
      height,
      padding,
      plotWidth,
      plotHeight,
      cumulativeValues,
      maxCumulative,
      xMinLabel,
      xMaxLabel,
    } = chartConfig
    const pointCount = Math.max(cumulativeValues.length, 1)
    const stepX = plotWidth / Math.max(pointCount - 1, 1)
    const safeMax = maxCumulative || 1

    const points = cumulativeValues
      .map((value, index) => {
        const x = padding.left + index * stepX
        const y = padding.top + plotHeight - (value / safeMax) * plotHeight
        return `${x},${y}`
      })
      .join(' ')

    return (
      <svg height="240" viewBox={`0 0 ${width} ${height}`} width="100%">
        <line
          stroke="#9CA3AF"
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={padding.top + plotHeight}
        />
        <line
          stroke="#9CA3AF"
          x1={padding.left}
          x2={padding.left + plotWidth}
          y1={padding.top + plotHeight}
          y2={padding.top + plotHeight}
        />
        <text
          fill="#6B7280"
          fontSize="10"
          textAnchor="end"
          x={padding.left - 6}
          y={padding.top + 4}
        >
          {maxCumulative.toFixed(0)}
        </text>
        <text
          fill="#6B7280"
          fontSize="10"
          textAnchor="end"
          x={padding.left - 6}
          y={padding.top + plotHeight}
        >
          0
        </text>
        <text
          fill="#6B7280"
          fontSize="10"
          textAnchor="start"
          x={padding.left}
          y={padding.top + plotHeight + 14}
        >
          <tspan dy="0" x={padding.left}>
            {formatTimeDate(xMinLabel).time}
          </tspan>
          <tspan dy="12" x={padding.left}>
            {formatTimeDate(xMinLabel).date}
          </tspan>
        </text>
        <text
          fill="#6B7280"
          fontSize="10"
          textAnchor="end"
          x={padding.left + plotWidth}
          y={padding.top + plotHeight + 14}
        >
          <tspan dy="0" x={padding.left + plotWidth}>
            {formatTimeDate(xMaxLabel).time}
          </tspan>
          <tspan dy="12" x={padding.left + plotWidth}>
            {formatTimeDate(xMaxLabel).date}
          </tspan>
        </text>
        <polyline
          fill="none"
          points={points}
          stroke="#10B981"
          strokeWidth={2}
        />
      </svg>
    )
  }, [chartConfig])

  return (
    <ErrorBoundary>
      <p>Setup complete</p>

      {/* <p>A: {error ? `Error: ${error}` : JSON.stringify(meterData)}</p> */}

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
      {/* <p>B: {error ? null : JSON.stringify(data)}</p> */}

      <div className="mt-4">
        <h2 className="mb-2 text-lg font-semibold">Energy data</h2>
        {data ? (
          <>
            {error ? (
              <p>Charts unavailable due to error.</p>
            ) : chartEntries.length === 0 ? (
              <p>No chart data available.</p>
            ) : (
              <>
                <h3 className="font-semibold">Energy by time period</h3>
                {barChartSvg}
                {/*
                <p className="text-sm text-gray-500">
                  From {timeLabel(chartEntries[0].from)} to{' '}
                  {timeLabel(chartEntries[chartEntries.length - 1].to)}
                </p>
                 */}
                <h3 className="mt-6 font-semibold">Cumulative energy</h3>
                {lineChartSvg}
              </>
            )}
          </>
        ) : (
          <p>Retrieving your meter data…</p>
        )}
      </div>

      {/* <p>You may now either:</p> */}
      {/* <div className="ml-8">{children}</div> */}
    </ErrorBoundary>
  )
}

export default ViewCAPSetupComplete
