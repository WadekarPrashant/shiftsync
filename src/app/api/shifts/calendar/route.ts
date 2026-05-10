import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const shifts = await prisma.shift.findMany({
      where: {
        userId: user.id,
        ...(start && end ? {
          date: {
            gte: new Date(start),
            lte: new Date(end),
          }
        } : {}),
      },
      include: { job: true },
      orderBy: { date: 'asc' },
    })

    const events = shifts.map(shift => {
      const d = new Date(shift.date)
      const year = d.getUTCFullYear()
      const month = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`

      return {
        id: shift.id,
        title: `${shift.job.name} (${shift.hoursWorked}h)`,
        start: `${dateStr}T${shift.startTime}`,
        end: `${dateStr}T${shift.endTime}`,
        backgroundColor: shift.job.color,
        borderColor: shift.job.color,
        textColor: '#ffffff',
        extendedProps: {
          jobName: shift.job.name,
          hoursWorked: shift.hoursWorked,
          wageEarned: shift.wageEarned,
          startTime: shift.startTime,
          endTime: shift.endTime,
          payType: shift.job.payType,
        }
      }
    })

    console.log(`Calendar: found ${shifts.length} shifts, returning ${events.length} events`)
    return NextResponse.json(events)
  } catch (err) {
    console.error('GET /api/shifts/calendar error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
