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
      take: 50,
    })
    return NextResponse.json(shifts)
  } catch (err) {
    console.error('GET /api/shifts error:', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { jobId, date, startTime, endTime, notes } = body

    if (!jobId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await prisma.profile.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email!, fullName: user.user_metadata?.full_name ?? null },
    })

    const job = await prisma.job.findFirst({ where: { id: jobId, userId: user.id } })
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    let hoursWorked = (endH * 60 + endM - (startH * 60 + startM)) / 60
    if (hoursWorked < 0) hoursWorked += 24

    const wageEarned = job.payType === 'HOURLY' && job.hourlyRate
      ? Math.round(hoursWorked * job.hourlyRate * 100) / 100
      : 0

    const shift = await prisma.shift.create({
      data: {
        userId: user.id,
        jobId,
        date: new Date(date),
        startTime,
        endTime,
        hoursWorked: Math.round(hoursWorked * 100) / 100,
        wageEarned,
        notes: notes ?? null,
      },
      include: { job: true },
    })
    return NextResponse.json(shift)
  } catch (err) {
    console.error('POST /api/shifts error:', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}
