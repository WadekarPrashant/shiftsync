'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

const JOB_COLORS = [
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Teal', value: '#14b8a6' },
]

interface Job {
  id: string
  name: string
  color: string
  payType: string
  hourlyRate: number | null
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [name, setName] = useState('')
  const [color, setColor] = useState('#ef4444')
  const [payType, setPayType] = useState('HOURLY')
  const [hourlyRate, setHourlyRate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadJobs() {
    const res = await fetch('/api/jobs')
    const data = await res.json()
    setJobs(data)
  }

  useEffect(() => { loadJobs() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color, payType, hourlyRate: hourlyRate || null }),
    })
    if (res.ok) {
      setName('')
      setHourlyRate('')
      setPayType('HOURLY')
      setColor('#ef4444')
      await loadJobs()
    } else {
      const d = await res.json()
      setError(d.error)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
    await loadJobs()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a Job</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Job name</Label>
                <Input
                  id="name"
                  placeholder="e.g. DoorDash"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {JOB_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className="w-7 h-7 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: c.value,
                        borderColor: color === c.value ? '#1e293b' : 'transparent',
                        transform: color === c.value ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payTypeSelect">Pay type</Label>
                <select
                  id="payTypeSelect"
                  value={payType}
                  onChange={e => setPayType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="HOURLY">Hourly rate</option>
                  <option value="DELIVERY">Delivery (variable)</option>
                </select>
              </div>
              {payType === 'HOURLY' && (
                <div className="space-y-2">
                  <Label htmlFor="rate">Hourly rate ($)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 23.50"
                    value={hourlyRate}
                    onChange={e => setHourlyRate(e.target.value)}
                  />
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Job'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {jobs.length === 0 && (
          <p className="text-slate-500 text-sm">No jobs added yet. Add your first job above.</p>
        )}
        {jobs.map(job => (
          <Card key={job.id}>
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: job.color }} />
                <span className="font-medium">{job.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {job.payType === 'HOURLY'
                    ? job.hourlyRate ? `$${job.hourlyRate}/hr` : 'Hourly'
                    : 'Delivery'}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(job.id)}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
