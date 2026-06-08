'use client'

import { useState, useEffect } from 'react'

type Holiday = {
  id: string
  name: string
  startDate: string
  endDate: string
}

function isActive(h: Holiday) {
  const now = new Date()
  return new Date(h.startDate) <= now && now <= new Date(h.endDate)
}

function isUpcoming(h: Holiday) {
  return new Date(h.startDate) > new Date()
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  async function fetchHolidays() {
    const res = await fetch('/api/holidays')
    const data = await res.json()
    setHolidays(Array.isArray(data) ? data : [])
  }

  useEffect(() => { fetchHolidays() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !startDate || !endDate) return
    setLoading(true)
    await fetch('/api/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startDate, endDate }),
    })
    setName(''); setStartDate(''); setEndDate('')
    await fetchHolidays()
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/holidays/${id}`, { method: 'DELETE' })
    setHolidays(prev => prev.filter(h => h.id !== id))
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Holiday Periods</h1>
        <p className="text-sm text-gray-500 mt-1">
          During registered course breaks, your 48hr/fortnight visa limit is suspended.
          Add your uni break dates here so ShiftSync tracks your hours correctly.
        </p>
      </div>

      {/* Add form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Add Holiday Period</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Winter Break 2025"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Holiday Period'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="space-y-3">
        {holidays.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No holiday periods added yet.</p>
        )}
        {holidays.map(h => {
          const active = isActive(h)
          const upcoming = isUpcoming(h)
          return (
            <div key={h.id} className={`flex items-center justify-between p-4 rounded-xl border ${active ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 text-sm">{h.name}</span>
                  {active && <span className="text-xs bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded-full font-medium">Active — Unlimited Hours</span>}
                  {upcoming && <span className="text-xs bg-blue-100 text-blue-700 border border-blue-300 px-2 py-0.5 rounded-full font-medium">Upcoming</span>}
                  {!active && !upcoming && <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">Past</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{fmt(h.startDate)} — {fmt(h.endDate)}</p>
              </div>
              <button
                onClick={() => handleDelete(h.id)}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
