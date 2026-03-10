const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatCurrency(value: string, currency: string) {
  const amount = Number(value)
  if (Number.isNaN(amount)) {
    return value
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDecimal(value: string, maximumFractionDigits = 8) {
  const amount = Number(value)
  if (Number.isNaN(amount)) {
    return value
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(amount)
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return 'Unavailable'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return dateTimeFormatter.format(date)
}

export function formatRelativePortfolioSize(balanceCount: number, positionCount: number) {
  if (balanceCount === 0 && positionCount === 0) {
    return 'Fresh workspace'
  }

  return `${balanceCount} balance${balanceCount === 1 ? '' : 's'} · ${positionCount} position${positionCount === 1 ? '' : 's'}`
}

export function getLocalDateTimeValue(value?: string) {
  const date = value ? new Date(value) : new Date()
  const tzOffset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - tzOffset * 60_000)
  return local.toISOString().slice(0, 16)
}

export function toIsoDateTime(localDateTime: string) {
  return new Date(localDateTime).toISOString()
}
