import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useAppContext, readBudget } from '../../context/AppContext.jsx'
import { formatCurrency } from '../../utils/formatters.js'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12, background: 'white', padding: '10px 14px', border: 'none' }}>
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.fill }} />
          {p.name}: <span className="font-bold ml-1">{formatCurrency(p.value)}</span>
        </p>
      ))}
      {payload.length === 2 && (
        <p className={`mt-1 text-xs font-semibold ${payload[1].value > payload[0].value ? 'text-red-500' : 'text-emerald-600'}`}>
          {payload[1].value > payload[0].value
            ? `Over by ${formatCurrency(payload[1].value - payload[0].value)}`
            : `Under by ${formatCurrency(payload[0].value - payload[1].value)}`}
        </p>
      )}
    </div>
  )
}

export default function BudgetVsActual({ transactions, monthConfig }) {
  const { pillarList } = useAppContext()
  const income = monthConfig.income || 0

  if (income === 0) return null

  const expenses = transactions.filter(t => t.type === 'expense')

  const data = pillarList.map(p => {
    const pct = readBudget(monthConfig, p.key, p.defaultBudget ?? 0)
    const budget = Math.round(income * (pct / 100))
    const actual = Math.round(expenses.filter(t => t.mainCategory === p.key).reduce((s, t) => s + t.amount, 0))
    return { name: p.label, Budget: budget, Actual: actual, color: p.color, over: actual > budget && budget > 0 }
  })

  const totalBudget = data.reduce((s, d) => s + d.Budget, 0)
  const totalActual = data.reduce((s, d) => s + d.Actual, 0)
  const overallOver  = totalActual > totalBudget

  return (
    <div className="px-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Budget vs Actual</h2>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${overallOver ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
          {overallOver ? `Over ${formatCurrency(totalActual - totalBudget)}` : `Under ${formatCurrency(totalBudget - totalActual)}`}
        </span>
      </div>
      <div className="bg-white rounded-2xl shadow-card p-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barSize={14} barGap={3} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false} tickLine={false} width={32}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Budget" name="Budget" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => <Cell key={i} fill={`${d.color}45`} />)}
            </Bar>
            <Bar dataKey="Actual" name="Actual" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.over ? '#EF4444' : d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-5 mt-1">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm bg-slate-200 border border-slate-300" />
            Budget
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm bg-indigo-500" />
            Actual
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm bg-red-400" />
            Over budget
          </span>
        </div>
      </div>
    </div>
  )
}
