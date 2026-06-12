import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { formatCurrency } from '../../utils/formatters.js'
import { fdMaturityValue, fdInterestEarned, daysUntilMaturity } from '../../services/fdCalculator.js'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const principal = payload[0]?.value || 0
  const interest = payload[1]?.value || 0
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-card text-xs space-y-1 min-w-[160px]">
      <p className="font-semibold text-slate-700">{label}</p>
      <div className="flex justify-between gap-4">
        <span className="text-slate-500">Principal</span>
        <span className="font-semibold">{formatCurrency(principal)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-emerald-600">Interest</span>
        <span className="font-semibold text-emerald-700">+{formatCurrency(interest)}</span>
      </div>
      <div className="flex justify-between gap-4 border-t border-slate-100 pt-1">
        <span className="text-slate-600 font-medium">Maturity</span>
        <span className="font-bold text-slate-800">{formatCurrency(principal + interest)}</span>
      </div>
    </div>
  )
}

export default function MaturityTimeline({ fds }) {
  if (!fds || fds.length === 0) return null

  const sorted = [...fds].sort((a, b) => new Date(a.maturityDate) - new Date(b.maturityDate))

  const data = sorted.map(fd => {
    const days = daysUntilMaturity(fd)
    const interest = Math.round(fdInterestEarned(fd))
    const label = days < 0
      ? `${fd.name} (matured)`
      : days === 0
        ? `${fd.name} (today!)`
        : `${fd.name}`
    return { name: label, principal: fd.principal, interest, days }
  })

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Projected Maturity Value</h3>
      <div style={{ height: Math.max(120, data.length * 56) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barSize={18}>
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={v => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 11, fill: '#475569' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="principal" stackId="a" fill="#4F46E5" name="Principal" radius={[0, 0, 0, 4]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.days < 0 ? '#94a3b8' : '#4F46E5'} />
              ))}
            </Bar>
            <Bar dataKey="interest" stackId="a" fill="#34d399" name="Interest" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-needs" />
          <span className="text-xs text-slate-500">Principal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-400" />
          <span className="text-xs text-slate-500">Interest</span>
        </div>
      </div>
    </div>
  )
}
