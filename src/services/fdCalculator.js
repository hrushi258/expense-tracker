const COMPOUNDS_PER_YEAR = { monthly: 12, quarterly: 4, annually: 1 }

function compoundsPerYear(frequency) {
  return COMPOUNDS_PER_YEAR[frequency] ?? 1
}

function futureValue(principal, annualRatePercent, frequency, years) {
  if (years <= 0 || principal <= 0) return principal
  const r = annualRatePercent / 100
  const n = compoundsPerYear(frequency)
  return principal * Math.pow(1 + r / n, n * years)
}

export function fdMaturityValue(fd) {
  const open = new Date(fd.openDate).getTime()
  const maturity = new Date(fd.maturityDate).getTime()
  const years = (maturity - open) / (365.25 * 24 * 60 * 60 * 1000)
  return futureValue(fd.principal, fd.interestRate, fd.compoundingFrequency, years)
}

export function fdInterestEarned(fd) {
  return fdMaturityValue(fd) - fd.principal
}

export function daysUntilMaturity(fd) {
  return Math.ceil((new Date(fd.maturityDate) - new Date()) / (24 * 60 * 60 * 1000))
}

export function fdProgressPercent(fd) {
  const open = new Date(fd.openDate).getTime()
  const maturity = new Date(fd.maturityDate).getTime()
  const now = Date.now()
  if (now >= maturity) return 100
  if (now <= open) return 0
  return Math.round(((now - open) / (maturity - open)) * 100)
}
