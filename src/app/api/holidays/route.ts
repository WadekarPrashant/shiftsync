import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
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

  const holidays = await prisma.holidayPeriod.findMany({
    where: { userId: session.user.id },
    orderBy: { startDate: 'desc' },
  })
  return NextResponse.json(holidays)
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, startDate, endDate } = await req.json()
  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  await prisma.profile.upsert({
    where: { id: session.user.id },
    update: {},
    create: { id: session.user.id, email: session.user.email! },
  })

  const holiday = await prisma.holidayPeriod.create({
    data: {
      userId: session.user.id,
      name,
      startDate: new Date(startDate),
      endDate: (() => { const d = new Date(endDate); d.setHours(23, 59, 59, 999); return d })(),
    },
  })
  return NextResponse.json(holiday)
}
