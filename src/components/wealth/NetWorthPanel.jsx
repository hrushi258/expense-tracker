import React from 'react'
import { formatCurrency } from '../../utils/formatters.js'

function Row({ label, value, color, size = 'normal', border = false }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${border ? 'border-t border-slate-100' : ''}`}>
      <span className={`${size === 'large' ? 'text-sm font-bold text-slate-800' : 'text-sm text-slate-500'}`}>{label}</span>
      <span className={`font-bold ${size === 'large' ? 'text-base' : 'text-sm'}`} style={{ color: color || '#1e293b' }}>
        {value}
      </span>
    </div>
  )
}

export default function NetWorthPanel({ accounts, totalCCOutstanding }) {
  const totalLiquid    = accounts.filter(a => a.accountGroup === 'liquid').reduce((s, a) => s + (a.balance || 0), 0)
  const totalGrowth    = accounts.filter(a => a.accountGroup === 'growth').reduce((s, a) => s + (a.balance || 0), 0)
  const totalEmergency = accounts.filter(a => a.accountGroup === 'emergency').reduce((s, a) => s + (a.balance || 0), 0)
  const totalAssets    = totalLiquid + totalGrowth + totalEmergency
  const netWorth       = totalAssets - totalCCOutstanding
  const netLiquidity   = (totalLiquid + totalEmergency) - totalCCOutstanding
  const allocationData = [
    { value: totalLiquid,    color: '#4F46E5', label: 'Liquid' },
    { value: totalGrowth,    color: '#F59E0B', label: 'Growth' },
    { value: totalEmergency, color: '#10B981', label: 'Emergency' },
  ]

  return (
    <div className="space-y-3">
      {/* Net Worth Hero */}
      <div className="bg-gradient-to-br from-needs to-indigo-700 rounded-2xl p-5 text-white">
        <p className="text-xs opacity-75 uppercase tracking-widest font-semibold mb-1">Net Worth</p>
        <p className="text-3xl font-bold">{formatCurrency(netWorth)}</p>
        <p className="text-xs opacity-60 mt-1">Total Assets − CC Liabilities</p>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-2xl shadow-card p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Assets</p>
        <Row label="💧 Liquid Accounts" value={formatCurrency(totalLiquid)} />
        <Row label="📈 Growth / Investments" value={formatCurrency(totalGrowth)} />
        <Row label="🛡️ Emergency Fund" value={formatCurrency(totalEmergency)} />
        <Row label="Total Assets" value={formatCurrency(totalAssets)} size="large" border />
      </div>

      <div className="bg-white rounded-2xl shadow-card p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Liabilities</p>
        <Row label="💳 CC Outstanding" value={formatCurrency(totalCCOutstanding)} color="#EF4444" />
      </div>

      {/* Net Liquidity — the key daily metric */}
      <div className={`rounded-2xl p-4 border ${netLiquidity >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: netLiquidity >= 0 ? '#059669' : '#DC2626' }}>
          Net Liquidity (Day-to-Day)
        </p>
        <p className="text-xl font-bold" style={{ color: netLiquidity >= 0 ? '#059669' : '#DC2626' }}>
          {formatCurrency(netLiquidity)}
        </p>
        <p className="text-xs mt-1" style={{ color: netLiquidity >= 0 ? '#6ee7b7' : '#fca5a5' }}>
          (Liquid + Emergency) − CC Outstanding
        </p>
        {netLiquidity < 0 && (
          <p className="text-xs text-red-600 mt-2 font-medium">
            Your liquid holdings are less than your credit card debt. Settle outstanding bills.
          </p>
        )}
      </div>

      {/* Allocation bar */}
      {totalAssets > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Allocation</p>
          <div className="flex rounded-full overflow-hidden h-3 gap-px">
            {allocationData.filter(d => d.value > 0).map(d => (
              <div
                key={d.label}
                style={{ width: `${(d.value / totalAssets) * 100}%`, backgroundColor: d.color }}
                title={`${d.label}: ${formatCurrency(d.value)}`}
              />
            ))}
          </div>
          <div className="flex gap-4 mt-2 flex-wrap">
            {allocationData.filter(d => d.value > 0).map(d => (
              <div key={d.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.label} {Math.round((d.value / totalAssets) * 100)}%
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
