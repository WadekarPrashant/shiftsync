import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const goal = parseFloat(searchParams.get('goal') ?? '0')

    const now = new Date()
    const monthStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1)
    const monthEnd = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59)

    const shiftsThisMonth = await prisma.shift.findMany({
      where: {
        userId: user.id,
        date: { gte: monthStart, lte: monthEnd },
      },
      include: { job: true },
    })

    const earnedThisMonth = shiftsThisMonth.reduce((s, sh) => s + sh.wageEarned, 0)
    const hoursThisMonth = shiftsThisMonth.reduce((s, sh) => s + sh.hoursWorked, 0)

    // Rolling 14-day fortnightly remaining hours
    const windowEnd = new Date()
    windowEnd.setHours(23, 59, 59, 999)
    const windowStart = new Date(windowEnd)
    windowStart.setDate(windowStart.getDate() - 13)
    windowStart.setHours(0, 0, 0, 0)

    const fortnightShifts = await prisma.shift.findMany({
      where: {
        userId: user.id,
        date: { gte: windowStart, lte: windowEnd },
      },
    })

    const hoursUsedFortnight = fortnightShifts.reduce((s, sh) => s + sh.hoursWorked, 0)
    const hoursRemainingFortnight = Math.max(0, 48 - hoursUsedFortnight)

    // Average hourly rate across hourly jobs
    const hourlyJobs = await prisma.job.findMany({
      where: { userId: user.id, isActive: true, payType: 'HOURLY', hourlyRate: { not: null } },
    })
    const avgRate = hourlyJobs.length > 0
      ? hourlyJobs.reduce((s, j) => s + (j.hourlyRate ?? 0), 0) / hourlyJobs.length
      : 0

    const stillNeeded = Math.max(0, goal - earnedThisMonth)
    const hoursNeeded = avgRate > 0 ? stillNeeded / avgRate : null
    const achievable = hoursNeeded !== null ? hoursNeeded <= hoursRemainingFortnight : null
    const monthName = now.toLocaleDateString('en-AU', { month: 'long' })

    return NextResponse.json({
      goal,
      earnedThisMonth: Math.round(earnedThisMonth * 100) / 100,
      stillNeeded: Math.round(stillNeeded * 100) / 100,
      hoursThisMonth: Math.round(hoursThisMonth * 100) / 100,
      hoursRemainingFortnight: Math.round(hoursRemainingFortnight * 100) / 100,
      hoursNeeded: hoursNeeded !== null ? Math.round(hoursNeeded * 100) / 100 : null,
      avgRate: Math.round(avgRate * 100) / 100,
      achievable,
      monthName,
      shiftsThisMonth: shiftsThisMonth.length,
    })
  } catch (err) {
    console.error('GET /api/income-goal error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
