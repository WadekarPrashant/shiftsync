'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MonthData {
  key: string
  year: number
  month: number
  label: string
  goalAmount: number | null
  goalId: string | null
  earned: number
  hours: number
  shifts: number
  percentage: number | null
  isCurrentMonth: boolean
  hit: boolean | null
}

interface GoalResponse {
  currentMonth: MonthData
  history: MonthData[]
}

export default function GoalsPage() {
  const [data, setData] = useState<GoalResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [inputVal, setInputVal] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/monthly-goals')
    const d = await res.json()
    setData(d)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveGoal(year: number, month: number) {
    const amount = parseFloat(inputVal)
    if (isNaN(amount) || amount <= 0) return
    setSaving(true)
    await fetch('/api/monthly-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month, goalAmount: amount }),
    })
    setEditingKey(null)
    setInputVal('')
    setSaving(false)
    await load()
  }

  if (loading) return <div className="text-slate-500 text-sm">Loading goals...</div>
  if (!data) return null

  const pastMonths = (data.history ?? []).filter((h: MonthData) => !h.isCurrentMonth)

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Income Goals</h1>

      {/* Current Month */}
      <Card className="border-2 border-slate-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{data.currentMonth.label}</CardTitle>
            <span className="text-xs text-slate-400">Current month</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-500">Earned so far</p>
              <p className="text-4xl font-bold text-green-600">${data.currentMonth.earned.toFixed(2)}</p>
            </div>
            {data.currentMonth.goalAmount ? (
              <div className="text-right">
                <p className="text-xs text-slate-500">Goal</p>
                <p className="text-2xl font-semibold">${data.currentMonth.goalAmount.toLocaleString()}</p>
              </div>
            ) : null}
          </div>

          {data.currentMonth.goalAmount && data.currentMonth.percentage !== null ? (
            <div className="space-y-1">
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${data.currentMonth.percentage}%`,
                    backgroundColor: data.currentMonth.hit ? '#22c55e' : '#3b82f6',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{data.currentMonth.percentage}% of goal</span>
                <span>
                  {data.currentMonth.hit
                    ? 'Goal reached!'
                    : `$${(data.currentMonth.goalAmount - data.currentMonth.earned).toFixed(2)} to go`}
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{data.currentMonth.shifts} shift{data.currentMonth.shifts !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{data.currentMonth.hours}h worked</span>
          </div>

          {editingKey === data.currentMonth.key ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input
                  type="number" min="1" step="50"
                  placeholder="e.g. 2000"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveGoal(data.currentMonth.year, data.currentMonth.month)}
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  autoFocus
                />
              </div>
              <button onClick={() => saveGoal(data.currentMonth.year, data.currentMonth.month)} disabled={saving}
                className="px-4 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditingKey(null)}
                className="px-4 py-2 border border-slate-300 text-sm rounded-md hover:bg-slate-50">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setEditingKey(data.currentMonth.key); setInputVal(data.currentMonth.goalAmount?.toString() ?? '') }}
              className="text-sm text-slate-500 hover:text-slate-900 underline">
              {data.currentMonth.goalAmount ? 'Change goal' : '+ Set a goal for this month'}
            </button>
          )}
        </CardContent>
      </Card>

      {/* Past Months History */}
      {pastMonths.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-3">Past Months</h2>
          <div className="space-y-3">
            {pastMonths.map(m => (
              <Card key={m.key}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{m.label}</span>
                      {m.hit === true && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Goal hit ✓</span>
                      )}
                      {m.hit === false && (
                        <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Missed</span>
                      )}
                      {m.hit === null && (
                        <span className="text-xs text-slate-400">No goal set</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-sm">${m.earned.toFixed(2)}</span>
                      {m.goalAmount && <span className="text-xs text-slate-400 ml-1">/ ${m.goalAmount.toLocaleString()}</span>}
                    </div>
                  </div>

                  {m.goalAmount && m.percentage !== null ? (
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${m.percentage}%`,
                            backgroundColor: m.hit ? '#22c55e' : '#f59e0b',
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-400">{m.percentage}% · {m.shifts} shift{m.shifts !== 1 ? 's' : ''} · {m.hours}h</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">{m.shifts} shift{m.shifts !== 1 ? 's' : ''} · {m.hours}h</p>
                  )}

                  {editingKey === m.key ? (
                    <div className="flex gap-2 mt-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                        <input type="number" min="1" step="50" placeholder="Set goal for this month"
                          value={inputVal}
                          onChange={e => setInputVal(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveGoal(m.year, m.month)}
                          className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                          autoFocus
                        />
                      </div>
                      <button onClick={() => saveGoal(m.year, m.month)} disabled={saving}
                        className="px-3 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-700 disabled:opacity-50">
                        {saving ? '...' : 'Save'}
                      </button>
                      <button onClick={() => setEditingKey(null)}
                        className="px-3 py-2 border border-slate-300 text-sm rounded-md hover:bg-slate-50">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingKey(m.key); setInputVal(m.goalAmount?.toString() ?? '') }}
                      className="text-xs text-slate-400 hover:text-slate-700 underline mt-1">
                      {m.goalAmount ? 'Edit goal' : '+ Add goal retroactively'}
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
