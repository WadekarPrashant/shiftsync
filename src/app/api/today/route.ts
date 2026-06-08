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

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const [fortnightShifts, todayShifts, holidays] = await Promise.all([
    prisma.shift.findMany({
      where: { userId, date: { gte: fortnightAgo, lte: now } },
    }),
    prisma.shift.findMany({
      where: { userId, date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.holidayPeriod.findMany({ where: { userId } }),
  ])

  // Check if today is in a holiday period
  const activeHoliday = holidays.find(h =>
    new Date(h.startDate) <= now && now <= new Date(h.endDate)
  )

  // Helper: is a date in any holiday?
  function isInHoliday(date: Date) {
    return holidays.some(h =>
      new Date(h.startDate) <= date && date <= new Date(h.endDate)
    )
  }

  // Exclude holiday shifts from the visa count
  const billableShifts = fortnightShifts.filter(s => !isInHoliday(new Date(s.date)))
  const hoursWorkedFortnight = billableShifts.reduce((sum, s) => sum + s.hoursWorked, 0)
  const hoursWorkedToday = todayShifts.reduce((sum, s) => sum + s.hoursWorked, 0)
  const hoursRemainingFortnight = Math.max(0, 48 - hoursWorkedFortnight)

  let status: 'safe' | 'warning' | 'danger' = 'safe'
  if (hoursRemainingFortnight <= 2) status = 'danger'
  else if (hoursRemainingFortnight <= 8) status = 'warning'

  return NextResponse.json({
    hoursWorkedToday: Math.round(hoursWorkedToday * 10) / 10,
    hoursWorkedFortnight: Math.round(hoursWorkedFortnight * 10) / 10,
    hoursRemainingFortnight: Math.round(hoursRemainingFortnight * 10) / 10,
    status,
    holidayMode: !!activeHoliday,
    activeHolidayName: activeHoliday?.name ?? null,
  })
}
