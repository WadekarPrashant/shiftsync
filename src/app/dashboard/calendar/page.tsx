'use client'

import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg } from '@fullcalendar/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor: string
  borderColor: string
  textColor: string
  extendedProps: {
    jobName: string
    hoursWorked: number
    wageEarned: number
    startTime: string
    endTime: string
    payType: string
  }
}

interface SelectedShift {
  title: string
  jobName: string
  hoursWorked: number
  wageEarned: number
  startTime: string
  endTime: string
  payType: string
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selected, setSelected] = useState<SelectedShift | null>(null)

  useEffect(() => {
    fetch('/api/shifts/calendar')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setEvents(data)
      })
      .catch(console.error)
  }, [])

  function handleEventClick(arg: EventClickArg) {
    const props = arg.event.extendedProps as CalendarEvent['extendedProps']
    setSelected({
      title: arg.event.title,
      jobName: props.jobName,
      hoursWorked: props.hoursWorked,
      wageEarned: props.wageEarned,
      startTime: props.startTime,
      endTime: props.endTime,
      payType: props.payType,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        <Link href="/dashboard/shifts/new">
          <Button>+ Add Shift</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek',
                }}
                events={events}
                eventClick={handleEventClick}
                height="auto"
                eventDisplay="block"
                displayEventTime={false}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {selected ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{selected.jobName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Time</p>
                  <p className="font-medium">{selected.startTime} – {selected.endTime}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Hours worked</p>
                  <p className="font-medium">{selected.hoursWorked}h</p>
                </div>
                {selected.payType === 'HOURLY' && selected.wageEarned > 0 && (
                  <div>
                    <p className="text-slate-500 text-xs">Earned</p>
                    <p className="font-medium text-green-600">${selected.wageEarned.toFixed(2)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-500">
                  {events.length === 0
                    ? 'No shifts logged yet. Add a shift to see it here.'
                    : 'Click any shift on the calendar to see details.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
