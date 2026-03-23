import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import type { DeptDistribution } from '../services/mockDataService'

const COLORS = ['#34d399', '#60a5fa', '#f59e0b', '#a78bfa', '#f472b6', '#22c55e']
const INACTIVE_COLOR = '#6b7280'

function formatPct(p: number) {
  return `${(p * 100).toFixed(0)}%`
}

function DonutCenterLabel({
  enabledCards,
  totalCards,
  top = '开启潮汐总卡数',
}: {
  enabledCards: number
  totalCards: number
  top?: string
}) {
  const pct = totalCards > 0 ? enabledCards / totalCards : 0
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <div className="text-xs font-medium text-gray-400">{top}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-gray-100">
        {enabledCards.toLocaleString()}
        <span className="text-base text-gray-300">{` / ${totalCards.toLocaleString()} Cards`}</span>
      </div>
      <div className="mt-1 text-xs text-gray-400">{formatPct(pct)} enabled</div>
    </div>
  )
}

export function DeptDistributionDonutChart({
  data,
  enabledCards,
  totalCards,
  loading,
}: {
  data: DeptDistribution
  enabledCards: number
  totalCards: number
  loading?: boolean
}) {
  const hasData = data.length > 0
  const enabledSum = data.reduce((acc, d) => acc + d.tidalGpus, 0)
  const disabled = Math.max(0, totalCards - enabledSum)

  const pieData: Array<{
    name: string
    value: number
    color: string
    percentageOfTotal: number
  }> = [
    ...data.map((d, i) => ({
      name: d.deptName,
      value: d.tidalGpus,
      color: COLORS[i % COLORS.length],
      percentageOfTotal: totalCards > 0 ? d.tidalGpus / totalCards : 0,
    })),
    ...(disabled > 0
      ? [
          {
            name: '未开启潮汐',
            value: disabled,
            color: INACTIVE_COLOR,
            percentageOfTotal: totalCards > 0 ? disabled / totalCards : 0,
          },
        ]
      : []),
  ]

  return (
    <div className="h-full">
      <div className="relative h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 90, bottom: 8, left: 8 }}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="rgba(17, 24, 39, 0.9)"
              strokeWidth={2}
              isAnimationActive={!loading}
            >
              {pieData.map((d, idx) => (
                <Cell key={`cell-${idx}`} fill={d.color} />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                background: 'rgba(17, 24, 39, 0.96)',
                border: '1px solid rgba(75, 85, 99, 0.6)',
                borderRadius: 10,
              }}
              labelStyle={{ color: 'rgba(229, 231, 235, 0.9)' }}
              itemStyle={{ color: 'rgba(229, 231, 235, 0.9)' }}
              formatter={(value, _name, item) => {
                const v =
                  typeof value === 'number' ? value : Number(value ?? 0)
                const payload = item && typeof item === 'object' && 'payload' in item
                  ? (item as { payload?: { percentageOfTotal?: number } })
                      .payload
                  : undefined
                const pct = payload?.percentageOfTotal ?? 0
                return [`${v} Cards · ${formatPct(pct)} of total`, '']
              }}
            />

            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              wrapperStyle={{ right: 0 }}
              formatter={(value) => (
                <span className="text-xs text-gray-200">{String(value)}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        <DonutCenterLabel enabledCards={enabledCards} totalCards={totalCards} />

        {!loading && !hasData ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-gray-800 bg-gray-950/40 text-sm text-gray-400">
            No data
          </div>
        ) : null}
      </div>
    </div>
  )
}

