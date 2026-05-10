'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GoalData {
  goal: number
  earnedThisMonth: number
  stillNeeded: number
  hoursThisMonth: number
  hoursRemainingFortnight: number
  hoursNeeded: number | null
  avgRate: number
  achievable: boolean | null
  monthName: string
  shiftsThisMonth: number
}

export default function IncomeGoalTracker() {
  const [goal, setGoal] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    return parseFloat(localStorage.getItem('shiftsync_income_goal') ?? '0')
  })
  const [inputVal, setInputVal] = useState('')
  const [editing, setEditing] = useState(false)
  const [data, setData] = useState<GoalData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = parseFloat(localStorage.getItem('shiftsync_income_goal') ?? '0')
    setGoal(stored)
    setInputVal(stored > 0 ? stored.toString() : '')
  }, [])

  useEffect(() => {
    if (goal <= 0) return
    setLoading(true)
    fetch(`/api/income-goal?goal=${goal}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [goal])

  function saveGoal() {
    const val = parseFloat(inputVal)
    if (isNaN(val) || val <= 0) return
    localStorage.setItem('shiftsync_income_goal', val.toString())
    setGoal(val)
    setEditing(false)
  }

  const percentage = data && data.goal > 0
    ? Math.min(100, (data.earnedThisMonth / data.goal) * 100)
    : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Income Goal</CardTitle>
          <button
            onClick={() => { setEditing(true); setInputVal(goal > 0 ? goal.toString() : '') }}
            className="text-xs text-slate-500 hover:text-slate-900 underline"
          >
            {goal > 0 ? 'Change goal' : 'Set goal'}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing || goal <= 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Set your income target for this month:</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  min="1"
                  step="50"
                  placeholder="e.g. 2000"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveGoal()}
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
              <button
                onClick={saveGoal}
                className="px-4 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-700"
              >
                Set
              </button>
              {goal > 0 && (
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-slate-300 text-sm rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="h-24 animate-pulse bg-slate-100 rounded" />
        ) : data ? (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-slate-500">{data.monthName} goal</p>
                <p className="text-3xl font-bold">${data.goal.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">earned so far</p>
                <p className="text-2xl font-semibold text-green-600">${data.earnedThisMonth.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 text-right">{percentage.toFixed(0)}% of goal reached</p>
            </div>

            {data.stillNeeded > 0 ? (
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">
                  Still need: <span className="text-slate-900">${data.stillNeeded.toFixed(2)}</span>
                </p>
                {data.hoursNeeded !== null && data.avgRate > 0 && (
                  <p className="text-sm text-slate-600">
                    ≈ {data.hoursNeeded.toFixed(1)} more hours at avg ${data.avgRate.toFixed(2)}/hr
                  </p>
                )}
                {data.achievable === true && (
                  <p className="text-sm text-green-700 font-medium">
                    Achievable within your {data.hoursRemainingFortnight.toFixed(1)} remaining fortnight hours
                  </p>
                )}
                {data.achievable === false && (
                  <p className="text-sm text-red-600 font-medium">
                    Not achievable this fortnight — only {data.hoursRemainingFortnight.toFixed(1)} visa hours remaining
                  </p>
                )}
                {data.achievable === null && (
                  <p className="text-sm text-slate-500">Add hourly-rate jobs to see feasibility estimate</p>
                )}
              </div>
            ) : (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm font-medium text-green-700">Goal reached! You hit your {data.monthName} target.</p>
              </div>
            )}

            <p className="text-xs text-slate-400">{data.shiftsThisMonth} shift{data.shiftsThisMonth !== 1 ? 's' : ''} logged this month</p>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
