import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAppContext } from '../../context/AppContext.jsx'
import { formatCurrency } from '../../utils/formatters.js'

export default function FixedVsVariable({ transactions }) {
  const { pillarList } = useAppContext()
  const expenses = transactions.filter(t => t.type === 'expense')

  const data = pillarList.map(p => {
    const pl = expenses.filter(t => t.mainCategory === p.key)
    return {
      name: p.label.slice(0, 5),
      Fixed: pl.filter(t => t.costType === 'fixed').reduce((s, t) => s + t.amount, 0),
      Variable: pl.filter(t => t.costType === 'variable').reduce((s, t) => s + t.amount, 0),
    }
  }).filter(d => d.Fixed > 0 || d.Variable > 0)

  const totalFixed    = expenses.filter(t => t.costType === 'fixed').reduce((s, t) => s + t.amount, 0)
  const totalVariable = expenses.filter(t => t.costType === 'variable').reduce((s, t) => s + t.amount, 0)

  if (data.length === 0) return null

  return (
    <div className="px-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Fixed vs Variable</h2>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />Fixed {formatCurrency(totalFixed)}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-400" />Var {formatCurrency(totalVariable)}
          </span>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-card p-4">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={18} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(value), '']}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
            />
            <Bar dataKey="Fixed"    fill="#6366F1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Variable" fill="#FB923C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
