'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FortnightData {
  hoursWorked: number
  hoursRemaining: number
  wageEarned: number
  percentage: number
  shiftCount: number
  windowStart: string
  windowEnd: string
  status: 'safe' | 'warning' | 'danger'
}

export default function FortnightlyTracker() {
  const [data, setData] = useState<FortnightData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/fortnightly')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-32 animate-pulse bg-slate-100 rounded" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const start = new Date(data.windowStart).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  const end = new Date(data.windowEnd).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })

  const barColor = data.status === 'danger' ? '#ef4444' : data.status === 'warning' ? '#f59e0b' : '#22c55e'
  const statusLabel = data.status === 'danger' ? 'Limit Near' : data.status === 'warning' ? 'Warning' : 'On Track'
  const statusBg = data.status === 'danger' ? 'bg-red-50 border-red-200' : data.status === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
  const statusText = data.status === 'danger' ? 'text-red-700' : data.status === 'warning' ? 'text-yellow-700' : 'text-green-700'

  return (
    <Card className={`border-2 ${statusBg}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Fortnightly Visa Hours</CardTitle>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${statusText} ${statusBg}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-xs text-slate-500">{start} — {end} · rolling 14-day window</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-5xl font-bold">{data.hoursWorked.toFixed(1)}</span>
            <span className="text-slate-500 ml-2 text-lg">/ 48 hrs used</span>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: barColor }}>
              {data.hoursRemaining.toFixed(1)} hrs
            </p>
            <p className="text-sm text-slate-500">remaining this fortnight</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 rounded-full transition-all duration-500"
              style={{ width: `${data.percentage}%`, backgroundColor: barColor }}
            />
          </div>
          <p className="text-xs text-slate-500 text-right">{data.percentage}% of 48-hour visa limit</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-500">Earned this fortnight</p>
            <p className="text-lg font-semibold">${data.wageEarned.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Shifts this fortnight</p>
            <p className="text-lg font-semibold">{data.shiftCount}</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 pt-1">
          Guide only — verify your exact visa work limits with a registered migration agent or the Department of Home Affairs.
        </p>
      </CardContent>
    </Card>
  )
}
