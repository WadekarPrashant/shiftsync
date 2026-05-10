import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const jobs = await prisma.job.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(jobs)
  } catch (err) {
    console.error('GET /api/jobs error:', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, color, payType, hourlyRate } = body

    if (!name || !color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 })
    }

    await prisma.profile.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email!,
        fullName: user.user_metadata?.full_name ?? null,
      },
    })

    const job = await prisma.job.create({
      data: {
        userId: user.id,
        name,
        color,
        payType: payType ?? 'HOURLY',
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      },
    })
    return NextResponse.json(job)
  } catch (err) {
    console.error('POST /api/jobs error:', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}
