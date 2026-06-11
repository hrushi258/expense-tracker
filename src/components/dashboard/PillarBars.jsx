import React from 'react'
import { PILLAR_META, PILLARS } from '../../db/db.js'
import { formatCurrency } from '../../utils/formatters.js'

export default function PillarBars({ transactions, monthConfig }) {
  const income = monthConfig.income || 0

  const pillarTotals = PILLARS.reduce((acc, p) => {
    acc[p] = transactions
      .filter(t => t.type === 'expense' && t.mainCategory === p)
      .reduce((s, t) => s + t.amount, 0)
    return acc
  }, {})

  const budgetKeys = {
    needs: monthConfig.budgetNeeds ?? 50,
    wants: monthConfig.budgetWants ?? 30,
    savings: monthConfig.budgetSavings ?? 10,
    investments: monthConfig.budgetInvestments ?? 10,
  }

  return (
    <div className="px-4 mt-4">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Budget Allocation</h2>
      <div className="bg-white rounded-2xl shadow-card divide-y divide-slate-50">
        {PILLARS.map(p => {
          const meta = PILLAR_META[p]
          const spent = pillarTotals[p]
          const pct = budgetKeys[p]
          const budget = income * (pct / 100)
          const fill = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
          const over = budget > 0 && spent > budget

          return (
            <div key={p} className="px-4 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: meta.light }}>
                    {['🏠', '✨', '🏦', '📊'][PILLARS.indexOf(p)]}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{meta.label}</span>
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
                  style={{
                    width: `${fill}%`,
                    backgroundColor: over ? '#EF4444' : meta.color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
