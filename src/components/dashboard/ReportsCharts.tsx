'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

interface JobStat { name: string; color: string; hours: number; wage: number; shifts: number }
interface MonthStat { label: string; hours: number; wage: number }

interface Props {
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
      if (!Array.isArray(rows) || rows.length === 0) { alert('No shifts to export.'); setLoading(false); return }
      const headers = Object.keys(rows[0])
      const csv = [headers.join(','), ...rows.map((row: Record<string, string | number>) => headers.map(h => { const val = row[h] ?? ''; return typeof val === 'string' && val.includes(',') ? `"${val}"` : val }).join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shiftsync-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Export failed.') }
    setLoading(false)
  }
  return (
    <button onClick={handleExport} disabled={loading} className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-md hover:bg-slate-700 disabled:opacity-50">
      {loading ? 'Exporting...' : 'Export CSV'}
    </button>
  )
}

export default function ReportsCharts({ byJob, byMonth }: Props) {
  return (
    <div className="space-y-6">
      {byMonth.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Hours by Month</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byMonth}>
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
      {byJob.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Earnings by Job</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byJob}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Earned']} />
                <Bar dataKey="wage" radius={[4, 4, 0, 0]}>
                  {byJob.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center justify-between">
        <span />
        <ExportButton />
      </div>
    </div>
  )
}
