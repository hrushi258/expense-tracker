import React from 'react'
import { useAppContext, readBudget } from '../../context/AppContext.jsx'
import { formatCurrency } from '../../utils/formatters.js'

export default function PillarBars({ transactions, monthConfig }) {
  const { pillarList } = useAppContext()
  const income = monthConfig.income || 0

  return (
    <div className="px-4 mt-4">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Budget Allocation</h2>
      <div className="bg-white rounded-2xl shadow-card divide-y divide-slate-50">
        {pillarList.map(p => {
          const spent = transactions
            .filter(t => t.type === 'expense' && t.mainCategory === p.key)
            .reduce((s, t) => s + t.amount, 0)
          const pct = readBudget(monthConfig, p.key, p.defaultBudget ?? 0)
          const budget = income * (pct / 100)
          const fill = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
          const over = budget > 0 && spent > budget

          return (
            <div key={p.key} className="px-4 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: p.lightColor }}>
                    {p.icon}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{p.label}</span>
                  <span className="text-xs text-slate-400">{pct}%</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${over ? 'text-red-500' : 'text-slate-700'}`}>
                    {formatCurrency(spent)}
                  </span>
                  {income > 0 && (
                    <span className="text-xs text-slate-400 ml-1">/ {formatCurrency(budget)}</span>
                  )}
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${fill}%`, backgroundColor: over ? '#EF4444' : p.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
