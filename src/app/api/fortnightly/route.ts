import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const windowEnd = new Date(now)
    windowEnd.setHours(23, 59, 59, 999)
    const windowStart = new Date(windowEnd)
    windowStart.setDate(windowStart.getDate() - 13)
    windowStart.setHours(0, 0, 0, 0)

    const shifts = await prisma.shift.findMany({
      where: {
        userId: user.id,
        date: { gte: windowStart, lte: windowEnd },
      },
    })

    const hoursWorked = shifts.reduce((s, sh) => s + sh.hoursWorked, 0)
    const wageEarned = shifts.reduce((s, sh) => s + sh.wageEarned, 0)
    const hoursRemaining = Math.max(0, 48 - hoursWorked)
    const percentage = Math.min(100, (hoursWorked / 48) * 100)

    return NextResponse.json({
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      hoursRemaining: Math.round(hoursRemaining * 100) / 100,
      wageEarned: Math.round(wageEarned * 100) / 100,
      percentage: Math.round(percentage * 10) / 10,
      shiftCount: shifts.length,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      status: percentage >= 94 ? 'danger' : percentage >= 80 ? 'warning' : 'safe',
    })
  } catch (err) {
    console.error('GET /api/fortnightly error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
