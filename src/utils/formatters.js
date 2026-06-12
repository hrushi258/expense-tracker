const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatCurrency(amount) {
  return INR.format(amount)
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatShortDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

export function getCurrentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthToLabel(month) {
  const [year, m] = month.split('-')
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

export function getPreviousMonths(n = 6) {
  const months = []
  const d = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(d.getFullYear(), d.getMonth() - i, 1)
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

export function navigateMonth(month, direction) {
  const [year, m] = month.split('-').map(Number)
  const d = new Date(year, m - 1 + direction, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function todayDateString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
