'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface JobStat {
  name: string
  color: string
  hours: number
  wage: number
  shifts: number
}

interface MonthStat {
  label: string
  hours: number
  wage: number
}

interface ReportData {
  totalShifts: number
  totalHours: number
  totalWage: number
  byJob: JobStat[]
  byMonth: MonthStat[]
}

function ExportButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch('/api/export')
      const rows = await res.json()
      if (!Array.isArray(rows) || rows.length === 0) {
        alert('No shifts to export.')
        setLoading(false)
        return
      }
      const headers = Object.keys(rows[0])
      const csv = [
        headers.join(','),
        ...rows.map((row: Record<string, string | number>) =>
          headers.map(h => {
            const val = row[h] ?? ''
            return typeof val === 'string' && val.includes(',') ? `"${val}"` : val
          }).join(',')
        )
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shiftsync-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Export failed.')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
    >
      {loading ? 'Exporting...' : 'Export CSV'}
    </button>
  )
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-slate-500 text-sm">Loading reports...</div>
  if (!data) return <div className="text-slate-500 text-sm">Failed to load reports.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <ExportButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Total shifts</p>
            <p className="text-3xl font-bold mt-1">{data.totalShifts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Total hours</p>
            <p className="text-3xl font-bold mt-1">{data.totalHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Total earned</p>
            <p className="text-3xl font-bold mt-1 text-green-600">${data.totalWage.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {data.byMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hours by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}h`, 'Hours']} />
                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {data.byJob.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Earnings by Job</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.byJob}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Earned']} />
                <Bar dataKey="wage" radius={[4, 4, 0, 0]}>
                  {data.byJob.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By Job Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {data.byJob.length === 0 ? (
            <p className="text-sm text-slate-500">No shifts logged yet.</p>
          ) : (
            <div className="space-y-3">
              {data.byJob.map(job => (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
