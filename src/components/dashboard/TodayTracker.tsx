'use client'

import { useEffect, useState } from 'react'

type TodayData = {
  hoursWorkedToday: number
  hoursWorkedFortnight: number
  hoursRemainingFortnight: number
  status: 'safe' | 'warning' | 'danger'
}

export default function TodayTracker() {
  const [data, setData] = useState<TodayData | null>(null)

  useEffect(() => {
    fetch('/api/today')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return null

  const statusColor = {
    safe: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  }[data.status]

  const bgColor = {
    safe: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
  }[data.status]

  const message = data.hoursRemainingFortnight === 0
    ? "You've reached your 48hr visa limit for this fortnight."
    : data.status === 'danger'
    ? `Only ${data.hoursRemainingFortnight} hrs left — be careful today!`
    : data.status === 'warning'
    ? `${data.hoursRemainingFortnight} hrs left this fortnight — plan carefully.`
    : `You can work up to ${data.hoursRemainingFortnight} more hrs this fortnight.`

  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-700">⏱️ Today&apos;s Work Allowance</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
          data.status === 'safe' ? 'bg-green-100 text-green-700 border-green-300' :
          data.status === 'warning' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
          'bg-red-100 text-red-700 border-red-300'
        }`}>
          {data.status === 'safe' ? 'On Track' : data.status === 'warning' ? 'Getting Close' : 'Near Limit'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Worked today</p>
          <p className="text-2xl font-bold text-gray-800">{data.hoursWorkedToday}<span className="text-sm font-normal text-gray-500"> hrs</span></p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Can still work</p>
          <p className={`text-2xl font-bold ${statusColor}`}>{data.hoursRemainingFortnight}<span className="text-sm font-normal text-gray-500"> hrs</span></p>
        </div>
      </div>

      <p className="text-xs text-gray-600">{message}</p>
    </div>
  )
}
