import React, { useState } from 'react'
import { formatCurrency } from '../../utils/formatters.js'

const CX = 100, CY = 105, R = 82

function arcPoint(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return [CX + R * Math.cos(rad), CY - R * Math.sin(rad)]
}

function buildArcPath(p) {
  if (p <= 0) return null
  const clamped = Math.min(p, 1)
  const endAngle = (1 - clamped) * 180
  const [sx, sy] = arcPoint(180)
  const [ex, ey] = arcPoint(endAngle)
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${R} ${R} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`
}

function gaugeColor(months, target) {
  if (months === null || months === undefined) return '#cbd5e1'
  if (months >= target) return '#10B981'
  if (months >= target * 0.67) return '#F59E0B'
  if (months >= target * 0.33) return '#F97316'
  return '#EF4444'
}

const [bgL, bgR] = [arcPoint(180), arcPoint(0)]
const BG_ARC = `M ${bgL[0].toFixed(2)} ${bgL[1].toFixed(2)} A ${R} ${R} 0 0 1 ${bgR[0].toFixed(2)} ${bgR[1].toFixed(2)}`

export default function EmergencyFundGauge({ emergencyBalance, avgMonthlyEssentials, target, onTargetChange }) {
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetInput, setTargetInput] = useState(String(target))

  const runwayMonths = avgMonthlyEssentials > 0
    ? Math.round((emergencyBalance / avgMonthlyEssentials) * 10) / 10
    : null

  const pct = (runwayMonths !== null && target > 0) ? runwayMonths / target : 0
  const fillPath = buildArcPath(pct)
  const color = gaugeColor(runwayMonths, target)

  const handleTargetSave = () => {
    const v = Number(targetInput)
    if (v > 0 && v <= 36) { onTargetChange(v) }
    setEditingTarget(false)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full" style={{ height: 140 }}>
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <path d={BG_ARC} fill="none" stroke="#e2e8f0" strokeWidth={14} strokeLinecap="round" />
          {fillPath && (
            <path d={fillPath} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" />
          )}

          {/* Tick marks at 25%, 50%, 75%, 100% */}
          {[0.25, 0.5, 0.75, 1].map(t => {
            const angleDeg = (1 - t) * 180
            const [ix, iy] = arcPoint(angleDeg)
            const [ox, oy] = [CX + (R + 10) * Math.cos(angleDeg * Math.PI / 180), CY - (R + 10) * Math.sin(angleDeg * Math.PI / 180)]
            return (
              <line key={t} x1={ix.toFixed(1)} y1={iy.toFixed(1)} x2={ox.toFixed(1)} y2={oy.toFixed(1)}
                stroke="#cbd5e1" strokeWidth={1.5} />
            )
          })}

          {/* Center: runway value */}
          <text x="100" y="90" textAnchor="middle" fontSize="22" fontWeight="700" fill={runwayMonths !== null ? color : '#94a3b8'}>
            {runwayMonths !== null ? runwayMonths.toFixed(1) : '—'}
          </text>
          <text x="100" y="104" textAnchor="middle" fontSize="10" fill="#94a3b8">months runway</text>

          {/* Labels */}
          <text x="13" y="120" textAnchor="middle" fontSize="9" fill="#cbd5e1">0</text>
          <text x="187" y="120" textAnchor="middle" fontSize="9" fill="#cbd5e1">{target}m</text>
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        <div className="bg-slate-50 rounded-2xl p-3 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Emergency Fund</p>
          <p className="text-sm font-bold text-slate-800">{formatCurrency(emergencyBalance)}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-3 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Avg Monthly</p>
          <p className="text-sm font-bold text-slate-800">
            {avgMonthlyEssentials > 0 ? formatCurrency(Math.round(avgMonthlyEssentials)) : '—'}
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">essentials (3mo)</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-3 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Target</p>
          {editingTarget ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={targetInput}
                onChange={e => setTargetInput(e.target.value)}
                onBlur={handleTargetSave}
                onKeyDown={e => e.key === 'Enter' && handleTargetSave()}
                autoFocus
                className="w-10 text-sm font-bold text-center border-b-2 border-needs outline-none bg-transparent"
              />
              <span className="text-xs text-slate-500">mo</span>
            </div>
          ) : (
            <button onClick={() => { setEditingTarget(true); setTargetInput(String(target)) }}
              className="text-sm font-bold text-needs hover:underline">
              {target} mo
            </button>
          )}
        </div>
      </div>

      {avgMonthlyEssentials === 0 && (
        <p className="text-xs text-slate-400 text-center bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          No essential expenses logged yet. Add fixed Needs transactions to calculate runway.
        </p>
      )}

      {runwayMonths !== null && runwayMonths < target && (
        <div className="w-full bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-sm text-amber-700">
          Need <strong>{formatCurrency(Math.ceil((target - runwayMonths) * avgMonthlyEssentials))}</strong> more to reach {target}-month target.
        </div>
      )}

      {runwayMonths !== null && runwayMonths >= target && (
        <div className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-sm text-emerald-700">
          You have secured <strong>{runwayMonths.toFixed(1)} months</strong> of essential runway.
        </div>
      )}
    </div>
  )
}
