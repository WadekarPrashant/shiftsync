'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Job {
  id: string
  name: string
  color: string
  payType: string
  hourlyRate: number | null
}

export default function NewShiftPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobId, setJobId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [preview, setPreview] = useState<{ hours: number; wage: number } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/jobs').then(r => r.json()).then(setJobs)
  }, [])

  useEffect(() => {
    if (!startTime || !endTime || !jobId) { setPreview(null); return }
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    let hours = (eh * 60 + em - (sh * 60 + sm)) / 60
    if (hours < 0) hours += 24
    hours = Math.round(hours * 100) / 100
    const selectedJob = jobs.find(j => j.id === jobId)
    const wage = selectedJob?.payType === 'HOURLY' && selectedJob.hourlyRate
      ? Math.round(hours * selectedJob.hourlyRate * 100) / 100
      : null
    setPreview({ hours, wage: wage ?? 0 })
  }, [startTime, endTime, jobId, jobs])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jobId) { setError('Please select a job'); return }
    setLoading(true)
    setError('')

    const res = await fetch('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, date, startTime, endTime, notes }),
    })

    if (res.ok) {
      router.push('/dashboard/shifts')
    } else {
      const d = await res.json()
      setError(d.error)
      setLoading(false)
    }
  }

  const selectedJob = jobs.find(j => j.id === jobId)

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Log a Shift</h1>

      {jobs.length === 0 && (
        <Alert className="mb-4">
          <AlertDescription>
            You need to add a job first. <a href="/dashboard/jobs" className="font-medium underline">Add a job →</a>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shift Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              <div className="space-y-2">
                <Label htmlFor="jobSelect">Job</Label>
                <select
                  id="jobSelect"
                  value={jobId}
                  onChange={e => setJobId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Select a job...</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.name} {job.payType === 'HOURLY' && job.hourlyRate ? `($${job.hourlyRate}/hr)` : '(Delivery)'}
                    </option>
                  ))}
                </select>
              </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start time</Label>
                <Input
                  id="start"
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End time</Label>
                <Input
                  id="end"
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {preview && (
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <p className="font-medium" style={{ color: selectedJob?.color }}>
                  {selectedJob?.name}
                </p>
                <p className="text-slate-700 mt-1">
                  {preview.hours} hours worked
                  {preview.wage > 0 ? ` · $${preview.wage.toFixed(2)} earned` : ''}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="e.g. Busy Friday night shift"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading || jobs.length === 0}>
                {loading ? 'Saving...' : 'Save Shift'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
