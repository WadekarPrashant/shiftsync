import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const shifts = await prisma.shift.findMany({
      where: { userId: user.id },
      include: { job: true },
      orderBy: { date: 'asc' },
    })

    const rows = shifts.map(shift => {
      const d = new Date(shift.date)
      const dateStr = `${d.getUTCDate().toString().padStart(2,'0')}/${(d.getUTCMonth()+1).toString().padStart(2,'0')}/${d.getUTCFullYear()}`
      return {
        Date: dateStr,
        Employer: shift.job.name,
        'Start Time': shift.startTime,
        'End Time': shift.endTime,
        'Hours Worked': shift.hoursWorked,
        'Gross Pay ($)': shift.wageEarned > 0 ? shift.wageEarned : '',
        'Pay Type': shift.job.payType === 'HOURLY' ? 'Hourly' : 'Delivery',
        'Hourly Rate': shift.job.hourlyRate ?? '',
        Notes: shift.notes ?? '',
      }
    })

    return NextResponse.json(rows)
  } catch (err) {
    console.error('GET /api/export error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
