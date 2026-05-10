'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCurrentFortnight, getAdjacentFortnight, type FortnightPeriod } from '@/lib/fortnightly'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Shift {
  id: string
  date: string
  hoursWorked: number
  wageEarned: number
  job: { name: string; color: string }
}

interface Props {
  shifts: Shift[]
}

export default function FortnightlyTracker({ shifts }: Props) {
  const [period, setPeriod] = useState<FortnightPeriod>(getCurrentFortnight)

  const periodShifts = shifts.filter(s => {
    const d = new Date(s.date)
    return d >= period.start && d <= period.end
  })

  const totalHours = periodShifts.reduce((sum, s) => sum + s.hoursWorked, 0)
  const totalWage = periodShifts.reduce((sum, s) => sum + s.wageEarned, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Fortnightly Summary</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setPeriod(p => getAdjacentFortnight(p, 'prev'))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-slate-500 px-2 min-w-36 text-center">{period.label}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setPeriod(p => getAdjacentFortnight(p, 'next'))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Hours worked</p>
            <p className="text-2xl font-bold text-slate-900">{totalHours.toFixed(1)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Wages earned</p>
            <p className="text-2xl font-bold text-slate-900">${totalWage.toFixed(2)}</p>
          </div>
        </div>

        {periodShifts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No shifts in this period</p>
        ) : (
          <div className="space-y-2">
            {periodShifts.map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.job.color }} />
                  <span className="text-slate-600">{s.job.name}</span>
                  <span className="text-slate-400">
                    {new Date(s.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex gap-3 text-right">
                  <span className="text-slate-500">{s.hoursWorked.toFixed(1)}h</span>
                  <span className="font-medium text-slate-900">${s.wageEarned.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
