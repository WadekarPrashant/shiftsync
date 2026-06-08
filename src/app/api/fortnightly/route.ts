import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const now = new Date()
  const fortnightAgo = new Date(now)
  fortnightAgo.setDate(fortnightAgo.getDate() - 14)

  const windowStart = new Date(fortnightAgo)
  windowStart.setHours(0, 0, 0, 0)
  const windowEnd = new Date(now)
  windowEnd.setHours(23, 59, 59, 999)

  const [shifts, holidays] = await Promise.all([
    prisma.shift.findMany({
      where: { userId, date: { gte: windowStart, lte: windowEnd } },
    }),
    prisma.holidayPeriod.findMany({ where: { userId } }),
  ])

  // Check if today is in a holiday period
  const activeHoliday = holidays.find(h =>
    new Date(h.startDate) <= now && now <= new Date(h.endDate)
  )

  // Helper: is a given date within any holiday period?
  function isInHoliday(date: Date) {
    return holidays.some(h =>
      new Date(h.startDate) <= date && date <= new Date(h.endDate)
    )
  }

  // Only count shifts that are NOT during a holiday period
  const billableShifts = shifts.filter(s => !isInHoliday(new Date(s.date)))
  const hoursWorked = billableShifts.reduce((sum, s) => sum + s.hoursWorked, 0)
  const hoursRemaining = Math.max(0, 48 - hoursWorked)
  const percentage = Math.min(100, (hoursWorked / 48) * 100)

  let status: 'safe' | 'warning' | 'danger' = 'safe'
  if (percentage >= 94) status = 'danger'
  else if (percentage >= 80) status = 'warning'

  const totalHoursIncHoliday = shifts.reduce((sum, s) => sum + s.hoursWorked, 0)
  const totalEarned = shifts.reduce((sum, s) => sum + s.wageEarned, 0)

  return NextResponse.json({
    hoursWorked: Math.round(hoursWorked * 100) / 100,
    hoursRemaining: Math.round(hoursRemaining * 100) / 100,
    wageEarned: Math.round(totalEarned * 100) / 100,
    percentage: Math.round(percentage * 10) / 10,
    shiftCount: shifts.length,
    shiftsCount: shifts.length,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    status,
    holidayMode: !!activeHoliday,
    activeHolidayName: activeHoliday?.name ?? null,
    totalHoursIncHoliday: Math.round(totalHoursIncHoliday * 100) / 100,
  })
}
