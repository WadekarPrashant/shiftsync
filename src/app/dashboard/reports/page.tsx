import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ReportsCharts from '@/components/dashboard/ReportsCharts'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const shifts = await prisma.shift.findMany({
    where: { userId: user.id },
    include: { job: true },
    orderBy: { date: 'desc' },
  })

  const byJob: Record<string, { name: string; color: string; hours: number; wage: number; shifts: number }> = {}
  for (const shift of shifts) {
    if (!byJob[shift.jobId]) byJob[shift.jobId] = { name: shift.job.name, color: shift.job.color, hours: 0, wage: 0, shifts: 0 }
    byJob[shift.jobId].hours += shift.hoursWorked
    byJob[shift.jobId].wage += shift.wageEarned
    byJob[shift.jobId].shifts += 1
  }

  const byMonthMap: Record<string, { label: string; hours: number; wage: number }> = {}
  for (const shift of shifts) {
    const d = new Date(shift.date)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    const label = new Date(d.getUTCFullYear(), d.getUTCMonth(), 1).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
    if (!byMonthMap[key]) byMonthMap[key] = { label, hours: 0, wage: 0 }
    byMonthMap[key].hours += shift.hoursWorked
    byMonthMap[key].wage += shift.wageEarned
  }

  const totalHours = shifts.reduce((s, sh) => s + sh.hoursWorked, 0)
  const totalWage = shifts.reduce((s, sh) => s + sh.wageEarned, 0)
  const byJobArr = Object.values(byJob).sort((a, b) => b.hours - a.hours)
  const byMonthArr = Object.entries(byMonthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, v]) => ({ ...v, hours: Math.round(v.hours * 100) / 100, wage: Math.round(v.wage * 100) / 100 }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-slate-500">Total shifts</p><p className="text-3xl font-bold mt-1">{shifts.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-slate-500">Total hours</p><p className="text-3xl font-bold mt-1">{totalHours.toFixed(1)}h</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-slate-500">Total earned</p><p className="text-3xl font-bold mt-1 text-green-600">${totalWage.toFixed(2)}</p></CardContent></Card>
      </div>
      <ReportsCharts byJob={byJobArr} byMonth={byMonthArr} />
      {byJobArr.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">By Job Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byJobArr.map(job => (
                <div key={job.name} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: job.color }} />
                    <div>
                      <p className="font-medium text-sm">{job.name}</p>
                      <p className="text-xs text-slate-500">{job.shifts} shift{job.shifts !== 1 ? 's' : ''} · {job.hours.toFixed(1)}h</p>
                    </div>
                  </div>
                  <p className="font-semibold text-sm">${job.wage.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
