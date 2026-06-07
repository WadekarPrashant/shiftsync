import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.profile.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email!, fullName: user.user_metadata?.full_name ?? null },
    })

    const now = new Date()
    const currentYear = now.getUTCFullYear()
    const currentMonth = now.getUTCMonth() + 1

    const allShifts = await prisma.shift.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' },
    })

    const allGoals = await prisma.monthlyGoal.findMany({
      where: { userId: user.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    const shiftsByMonth: Record<string, { hours: number; wage: number; shifts: number }> = {}
    for (const shift of allShifts) {
      const d = new Date(shift.date)
      const y = d.getUTCFullYear()
      const m = d.getUTCMonth() + 1
      const key = `${y}-${m}`
      if (!shiftsByMonth[key]) shiftsByMonth[key] = { hours: 0, wage: 0, shifts: 0 }
      shiftsByMonth[key].hours += shift.hoursWorked
      shiftsByMonth[key].wage += shift.wageEarned
      shiftsByMonth[key].shifts += 1
    }

    const allKeys = new Set([
      ...Object.keys(shiftsByMonth),
      ...allGoals.map(g => `${g.year}-${g.month}`),
    ])

    const history = Array.from(allKeys).map(key => {
      const [y, m] = key.split('-').map(Number)
      const goal = allGoals.find(g => g.year === y && g.month === m)
      const stats = shiftsByMonth[key] ?? { hours: 0, wage: 0, shifts: 0 }
      const goalAmount = goal?.goalAmount ?? null
      const percentage = goalAmount && goalAmount > 0 ? Math.min(100, (stats.wage / goalAmount) * 100) : null
      const label = new Date(y, m - 1, 1).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
      return {
        key,
        year: y,
        month: m,
        label,
        goalAmount,
        goalId: goal?.id ?? null,
        earned: Math.round(stats.wage * 100) / 100,
        hours: Math.round(stats.hours * 100) / 100,
        shifts: stats.shifts,
        percentage: percentage !== null ? Math.round(percentage * 10) / 10 : null,
        isCurrentMonth: y === currentYear && m === currentMonth,
        hit: goalAmount !== null ? stats.wage >= goalAmount : null,
      }
    }).sort((a, b) => b.key.localeCompare(a.key))

    const currentMonthData = history.find(h => h.isCurrentMonth) ?? {
      key: `${currentYear}-${currentMonth}`,
      year: currentYear,
      month: currentMonth,
      label: new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }),
      goalAmount: null,
      goalId: null,
      earned: 0,
      hours: 0,
      shifts: 0,
      percentage: null,
      isCurrentMonth: true,
      hit: null,
    }

    return NextResponse.json({ currentMonth: currentMonthData, history })
  } catch (err) {
    console.error('GET /api/monthly-goals error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { year, month, goalAmount } = await request.json()

    await prisma.profile.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email!, fullName: user.user_metadata?.full_name ?? null },
    })

    const goal = await prisma.monthlyGoal.upsert({
      where: { userId_year_month: { userId: user.id, year, month } },
      update: { goalAmount },
      create: { userId: user.id, year, month, goalAmount },
    })

    return NextResponse.json(goal)
  } catch (err) {
    console.error('POST /api/monthly-goals error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
