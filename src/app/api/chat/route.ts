import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const { messages } = await req.json()

    const [jobs, recentShifts, goals] = await Promise.all([
      prisma.job.findMany({ where: { userId, isActive: true } }),
      prisma.shift.findMany({
        where: { userId },
        include: { job: true },
        orderBy: { date: 'desc' },
        take: 50,
      }),
      prisma.monthlyGoal.findMany({
        where: { userId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 3,
      }),
    ])

    const now = new Date()
    const fortnightAgo = new Date(now)
    fortnightAgo.setDate(fortnightAgo.getDate() - 14)
    const fortnightShifts = recentShifts.filter(s => new Date(s.date) >= fortnightAgo)
    const hoursWorked = fortnightShifts.reduce((sum, s) => sum + s.hoursWorked, 0)
    const hoursRemaining = Math.max(0, 48 - hoursWorked)

    const today = now.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const currentMonth = now.toLocaleString('en-AU', { month: 'long', year: 'numeric' })

    const jobsContext = jobs.map(j => {
      const rate = j.hourlyRate ? `$${j.hourlyRate}/hr` : 'rate not set'
      return `- ${j.name}: ${rate} (${j.payType})`
    }).join('\n')

    const shiftsContext = recentShifts.slice(0, 20).map(s =>
      `- ${new Date(s.date).toLocaleDateString('en-AU')}: ${s.job.name}, ${s.hoursWorked}hrs, $${s.wageEarned.toFixed(2)}`
    ).join('\n')

    const totalEarnings = recentShifts.reduce((sum, s) => sum + s.wageEarned, 0)
    const currentMonthShifts = recentShifts.filter(s => {
      const d = new Date(s.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const currentMonthEarnings = currentMonthShifts.reduce((sum, s) => sum + s.wageEarned, 0)
    const currentMonthHours = currentMonthShifts.reduce((sum, s) => sum + s.hoursWorked, 0)

    const currentGoal = goals[0]
    const goalContext = currentGoal
      ? `Current goal for ${currentMonth}: $${currentGoal.goalAmount} (earned $${currentMonthEarnings.toFixed(2)} so far, ${((currentMonthEarnings / currentGoal.goalAmount) * 100).toFixed(1)}% achieved)`
      : 'No income goal set for this month'

    const systemPrompt = `You are ShiftSync AI, a helpful assistant for international students managing multiple jobs in Australia.

Today is ${today}.

USER'S WORK DATA:
Active Jobs:
${jobsContext || 'No jobs added yet'}

Visa Hours (Last 14 days - fortnightly rolling window):
- Hours worked: ${hoursWorked.toFixed(1)} / 48 hrs
- Hours remaining: ${hoursRemaining.toFixed(1)} hrs
- Status: ${hoursWorked >= 45 ? '🔴 DANGER - Near limit' : hoursWorked >= 38 ? '🟡 WARNING - Getting close' : '🟢 Safe'}

Recent Shifts (last 20):
${shiftsContext || 'No shifts recorded yet'}

Earnings Summary:
- This month (${currentMonth}): $${currentMonthEarnings.toFixed(2)} across ${currentMonthHours.toFixed(1)} hrs
- Total recorded: $${totalEarnings.toFixed(2)}

Income Goal:
${goalContext}

INSTRUCTIONS:
- Answer questions about their shifts, earnings, visa hours, and goals
- Be friendly and concise
- Use Australian currency (AUD, $)
- Warn clearly if visa hours are close to the 48hr/fortnight limit
- If asked something you don't have data for, say so honestly
- Keep responses short (2-4 sentences max) unless they ask for detail`

    console.log('Calling Groq API with model: llama-3.1-70b-versatile')
    console.log('GROQ_API_KEY present:', !!process.env.GROQ_API_KEY)

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: false,
      max_tokens: 500,
      temperature: 0.7,
    })

    const text = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
    console.log('Groq response received, length:', text.length)

    return NextResponse.json({ reply: text })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
