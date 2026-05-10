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
      orderBy: { date: 'desc' },
    })

    // By job
    const byJob: Record<string, { name: string; color: string; hours: number; wage: number; shifts: number }> = {}
    for (const shift of shifts) {
      if (!byJob[shift.jobId]) {
        byJob[shift.jobId] = { name: shift.job.name, color: shift.job.color, hours: 0, wage: 0, shifts: 0 }
      }
      byJob[shift.jobId].hours += shift.hoursWorked
      byJob[shift.jobId].wage += shift.wageEarned
      byJob[shift.jobId].shifts += 1
    }

    // By month (last 6 months)
    const byMonth: Record<string, { label: string; hours: number; wage: number }> = {}
    for (const shift of shifts) {
      const d = new Date(shift.date)
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
      const label = new Date(d.getUTCFullYear(), d.getUTCMonth(), 1).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
      if (!byMonth[key]) byMonth[key] = { label, hours: 0, wage: 0 }
      byMonth[key].hours += shift.hoursWorked
      byMonth[key].wage += shift.wageEarned
    }

    const totalHours = shifts.reduce((s, sh) => s + sh.hoursWorked, 0)
    const totalWage = shifts.reduce((s, sh) => s + sh.wageEarned, 0)

    return NextResponse.json({
      totalShifts: shifts.length,
      totalHours: Math.round(totalHours * 100) / 100,
      totalWage: Math.round(totalWage * 100) / 100,
      byJob: Object.values(byJob).sort((a, b) => b.hours - a.hours),
      byMonth: Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([, v]) => v),
    })
  } catch (err) {
    console.error('GET /api/reports error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
