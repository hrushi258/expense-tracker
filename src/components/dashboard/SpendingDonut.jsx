import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppContext } from '../../context/AppContext.jsx'
import { formatCurrency } from '../../utils/formatters.js'

const RADIAN = Math.PI / 180

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${Math.round(percent * 100)}%`}
    </text>
  )
}

export default function SpendingDonut({ transactions }) {
  const { pillarList } = useAppContext()
  const expenses = transactions.filter(t => t.type === 'expense')

  const data = pillarList.map(p => ({
    name: p.label,
    value: expenses.filter(t => t.mainCategory === p.key).reduce((s, t) => s + t.amount, 0),
    color: p.color,
  })).filter(d => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="px-4 mt-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Spending Breakdown</h2>
        <div className="bg-white rounded-2xl shadow-card p-8 text-center">
          <p className="text-slate-300 text-3xl mb-2">📊</p>
          <p className="text-slate-400 text-sm">No expenses yet this month</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 mt-4">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Spending Breakdown</h2>
      <div className="bg-white rounded-2xl shadow-card p-4">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={<CustomLabel />}
            >
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip
              formatter={(value) => [formatCurrency(value), '']}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2 justify-center mt-1">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span>{d.name}</span>
              <span className="font-semibold">{formatCurrency(d.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
