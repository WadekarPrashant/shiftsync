'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Shift {
  id: string
  date: string
  startTime: string
  endTime: string
  hoursWorked: number
  wageEarned: number
  notes: string | null
  job: { id: string; name: string; color: string; payType: string }
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/shifts')
    const data = await res.json()
    setShifts(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this shift?')) return
    await fetch(`/api/shifts/${id}`, { method: 'DELETE' })
    await load()
  }

  if (loading) return <div className="text-slate-500">Loading shifts...</div>

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">All Shifts</h1>
        <Link href="/dashboard/shifts/new">
          <Button>+ Add Shift</Button>
        </Link>
      </div>

      {shifts.length === 0 && (
        <p className="text-slate-500 text-sm">No shifts logged yet.</p>
      )}

      {shifts.map(shift => {
        const dateStr = new Date(shift.date).toLocaleDateString('en-AU', {
          weekday: 'short', day: 'numeric', month: 'short'
        })
        return (
          <Card key={shift.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: shift.job.color }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{shift.job.name}</span>
                      <Badge variant="secondary" className="text-xs">{dateStr}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {shift.startTime} – {shift.endTime} · {shift.hoursWorked}h
                      {shift.job.payType === 'HOURLY' && shift.wageEarned > 0
                        ? ` · $${shift.wageEarned.toFixed(2)}`
                        : ''}
                    </p>
                    {shift.notes && <p className="text-xs text-slate-400 mt-1">{shift.notes}</p>}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(shift.id)}
                  className="text-red-600 hover:text-red-700 shrink-0"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
