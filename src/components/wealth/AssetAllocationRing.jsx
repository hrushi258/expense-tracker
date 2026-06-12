import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils/formatters.js'

const GROUP_META = {
  liquid:    { label: 'Liquid',    color: '#4F46E5' },
  growth:    { label: 'Growth',    color: '#F59E0B' },
  emergency: { label: 'Emergency', color: '#10B981' },
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-card text-xs">
      <p className="font-semibold text-slate-700">{d.label}</p>
      <p className="text-slate-500">{formatCurrency(d.value)}</p>
    </div>
  )
}

export default function AssetAllocationRing({ accounts }) {
  const grouped = { liquid: 0, growth: 0, emergency: 0 }
  accounts.forEach(a => { grouped[a.accountGroup] = (grouped[a.accountGroup] || 0) + (a.balance || 0) })
  const total = grouped.liquid + grouped.growth + grouped.emergency

  const data = Object.entries(grouped)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ key, value, label: GROUP_META[key].label, color: GROUP_META[key].color }))

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-44 gap-2">
        <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <p className="text-xs text-slate-400">Add accounts to see allocation</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={76}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map(d => <Cell key={d.key} fill={d.color} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Total</p>
          <p className="text-lg font-bold text-slate-800 leading-tight">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap justify-center">
        {data.map(d => (
          <div key={d.key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-slate-500">{d.label}</span>
            <span className="text-xs font-semibold text-slate-700">{formatCurrency(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
