import { useEffect, useRef } from 'react'
import { dispose, init } from 'klinecharts'

import type { ChartPayload } from '../lib/api'

type ChartPanelProps = {
  chartData: ChartPayload
  indicators: Array<'MA' | 'EMA' | 'MACD' | 'BOLL'>
}

export function ChartPanel({ chartData, indicators }: ChartPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<ReturnType<typeof init> | null>(null)

  useEffect(() => {
    if (!containerRef.current || !chartData.available) {
      return
    }

    const chart = init(containerRef.current)
    if (!chart) {
      return
    }
    chartRef.current = chart
    chart.applyNewData(
      chartData.bars.map((bar) => ({
        timestamp: bar.timestamp,
        open: Number(bar.open),
        high: Number(bar.high),
        low: Number(bar.low),
        close: Number(bar.close),
        volume: bar.volume === null ? undefined : Number(bar.volume),
      })),
    )

    indicators.forEach((indicator) => {
      chart.createIndicator(indicator)
    })

    chartData.markers.forEach((marker) => {
      if (marker.price === null) {
        return
      }
      chart.createOverlay({
        name: 'simpleAnnotation',
        points: [{ timestamp: marker.timestamp, value: Number(marker.price) }],
        extendData: marker.text,
      })
    })

    const handleResize = () => {
      chart.resize()
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        dispose(chartRef.current)
        chartRef.current = null
      }
    }
  }, [chartData, indicators])

  if (!chartData.available) {
    return (
      <div className="chart-fallback">
        <strong>Chart unavailable</strong>
        <span>{chartData.reason ?? 'No statement-derived series is available for this symbol yet.'}</span>
      </div>
    )
  }

  return <div ref={containerRef} className="chart-canvas" />
}
