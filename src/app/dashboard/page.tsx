import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import FortnightlyTracker from '@/components/dashboard/FortnightlyTracker'
import { Card, CardContent } from '@/components/ui/card'
import { Briefcase, Clock, DollarSign } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [shifts, jobs] = await Promise.all([
    prisma.shift.findMany({
      where: { userId: user.id },
    }),
    prisma.job.findMany({
      where: { userId: user.id, isActive: true },
    }),
  ])

  const totalHours = shifts.reduce((sum, s) => sum + s.hoursWorked, 0)
  const totalWage = shifts.reduce((sum, s) => sum + s.wageEarned, 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Overview</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Active jobs</p>
                <p className="text-xl font-bold text-slate-900">{jobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total hours</p>
                <p className="text-xl font-bold text-slate-900">{totalHours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total earned</p>
                <p className="text-xl font-bold text-slate-900">${totalWage.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <FortnightlyTracker />
    </div>
  )
}
