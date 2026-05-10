export interface FortnightPeriod {
  start: Date
  end: Date
  label: string
}

export function getFortnightPeriod(date: Date, anchorDate: Date = new Date('2026-01-05')): FortnightPeriod {
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const FORTNIGHT_MS = 14 * MS_PER_DAY

  const anchorTime = anchorDate.getTime()
  const dateTime = date.getTime()

  const daysSinceAnchor = Math.floor((dateTime - anchorTime) / MS_PER_DAY)
  const periodIndex = Math.floor(daysSinceAnchor / 14)

  const start = new Date(anchorTime + periodIndex * FORTNIGHT_MS)
  const end = new Date(start.getTime() + FORTNIGHT_MS - MS_PER_DAY)

  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  return {
    start,
    end,
    label: `${formatDate(start)} – ${formatDate(end)}`,
  }
}

export function getCurrentFortnight(): FortnightPeriod {
  return getFortnightPeriod(new Date())
}

export function getAdjacentFortnight(period: FortnightPeriod, direction: 'prev' | 'next'): FortnightPeriod {
  const MS_PER_FORTNIGHT = 14 * 24 * 60 * 60 * 1000
  const pivot = direction === 'next'
    ? new Date(period.end.getTime() + 1)
    : new Date(period.start.getTime() - 1)
  return getFortnightPeriod(pivot)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}
