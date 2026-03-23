import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { TidalServiceDetail } from '../services/mockDataService'

type ChartRow = {
  department: string
  l40s: number
  h800: number
  total: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Recharts Tooltip content props 与泛型耦合，避免与库类型冲突
function BarTooltipContent(props: any) {
  const { active, payload, label } = props
  if (!active || !payload?.length) return null
  const rows = payload as ReadonlyArray<{ name?: unknown; value?: unknown }>
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm"
      style={{
        background: 'rgba(17, 24, 39, 0.96)',
        borderColor: 'rgba(75, 85, 99, 0.6)',
        color: 'rgba(229, 231, 235, 0.95)',
      }}
    >
      {label != null ? (
        <div className="mb-1 font-medium text-gray-100">{String(label)}</div>
      ) : null}
      <div className="space-y-0.5 text-xs text-gray-300">
        {rows.map((entry, i) => {
          const raw = entry.value
          const v =
            typeof raw === 'number' ? raw : Number(raw ?? 0)
          return (
            <div key={i}>
              {String(entry.name ?? '')}: {v} Cards
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function DeptModelStackedBarChart({
  data,
  loading,
}: {
  data: TidalServiceDetail
  loading?: boolean
}) {
  const chartData = useMemo<ChartRow[]>(() => {
    const byDept = new Map<string, ChartRow>()
    for (const r of data) {
      const row =
        byDept.get(r.department) ?? {
          department: r.department,
          l40s: 0,
          h800: 0,
          total: 0,
        }
      if (r.gpuType.toUpperCase() === 'L40S') row.l40s += r.activeQuota
      if (r.gpuType.toUpperCase() === 'H800') row.h800 += r.activeQuota
      row.total += r.activeQuota
      byDept.set(r.department, row)
    }
    return [...byDept.values()].sort((a, b) => b.total - a.total)
  }, [data])

  return (
    <div className="h-[230px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 12, bottom: 4, left: 12 }}
        >
          <CartesianGrid stroke="rgba(75,85,99,0.35)" strokeDasharray="3 6" />
          <XAxis
            type="number"
            tick={{ fill: 'rgba(156,163,175,0.95)', fontSize: 11 }}
            tickLine={{ stroke: 'rgba(75,85,99,0.5)' }}
            axisLine={{ stroke: 'rgba(75,85,99,0.5)' }}
          />
          <YAxis
            type="category"
            dataKey="department"
            width={90}
            tick={{ fill: 'rgba(156,163,175,0.95)', fontSize: 11 }}
            tickLine={{ stroke: 'rgba(75,85,99,0.5)' }}
            axisLine={{ stroke: 'rgba(75,85,99,0.5)' }}
          />
          <Tooltip content={BarTooltipContent} />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-gray-200">{String(value)}</span>
            )}
          />
          <Bar
            dataKey="l40s"
            stackId="tidal"
            fill="#60a5fa"
            radius={[4, 4, 4, 4]}
            name="L40S 开启潮汐卡数"
            isAnimationActive={!loading}
          />
          <Bar
            dataKey="h800"
            stackId="tidal"
            fill="#34d399"
            radius={[4, 4, 4, 4]}
            name="H800 开启潮汐卡数"
            isAnimationActive={!loading}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

