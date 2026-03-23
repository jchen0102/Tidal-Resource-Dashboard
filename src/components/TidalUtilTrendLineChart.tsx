import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { TidalUtilizationTrend } from '../services/mockDataService'

function pct(x: number) {
  return Math.round(x * 100)
}

export function TidalUtilTrendLineChart({
  data,
  loading,
}: {
  data: TidalUtilizationTrend
  loading?: boolean
}) {
  const hasData = data.length > 0

  // Convert 0-1 utils into 0-100 for charting (keeps axis simple).
  const chartData = data.map((d) => ({
    time: d.time,
    online: pct(d.onlineUtil),
    tidal: pct(d.tidalUtil),
  }))

  return (
    <div className="h-full">
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="fillOnline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillTidal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(75, 85, 99, 0.35)" strokeDasharray="3 6" />

            <XAxis
              dataKey="time"
              tick={{ fill: 'rgba(156, 163, 175, 0.95)', fontSize: 11 }}
              tickLine={{ stroke: 'rgba(75, 85, 99, 0.5)' }}
              axisLine={{ stroke: 'rgba(75, 85, 99, 0.5)' }}
              interval={2}
              height={28}
              label={{
                value: '时间 (HH:mm)',
                position: 'insideBottomRight',
                offset: -4,
                fill: 'rgba(156, 163, 175, 0.9)',
                fontSize: 11,
              }}
            />

            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'rgba(156, 163, 175, 0.95)', fontSize: 11 }}
              tickLine={{ stroke: 'rgba(75, 85, 99, 0.5)' }}
              axisLine={{ stroke: 'rgba(75, 85, 99, 0.5)' }}
              tickFormatter={(v) => `${v}%`}
              width={44}
              label={{
                value: '利用率',
                angle: -90,
                position: 'insideLeft',
                fill: 'rgba(156, 163, 175, 0.9)',
                fontSize: 11,
              }}
            />

            <ReferenceLine
              y={85}
              stroke="rgba(239, 68, 68, 0.85)"
              strokeDasharray="6 6"
              ifOverflow="extendDomain"
              label={{
                value: 'SLA 85%',
                position: 'right',
                fill: 'rgba(248, 113, 113, 0.95)',
                fontSize: 11,
              }}
            />

            <Tooltip
              cursor={{ stroke: 'rgba(107, 114, 128, 0.45)', strokeWidth: 1 }}
              contentStyle={{
                background: 'rgba(17, 24, 39, 0.96)',
                border: '1px solid rgba(75, 85, 99, 0.6)',
                borderRadius: 10,
              }}
              labelStyle={{ color: 'rgba(229, 231, 235, 0.9)' }}
              formatter={(value, name) => [
                `${value}%`,
                name === 'online' ? '未开启潮汐资源' : '开启潮汐资源',
              ]}
            />

            <Legend
              verticalAlign="top"
              height={24}
              formatter={(value) => (
                <span className="text-xs text-gray-200">{String(value)}</span>
              )}
            />

            <Area
              type="monotone"
              dataKey="online"
              name="未开启潮汐资源"
              stroke="#60a5fa"
              strokeWidth={1.5}
              fill="url(#fillOnline)"
              fillOpacity={1}
              dot={false}
              isAnimationActive={!loading}
            />

            <Area
              type="monotone"
              dataKey="tidal"
              name="开启潮汐资源"
              stroke="#34d399"
              strokeWidth={2.5}
              fill="url(#fillTidal)"
              fillOpacity={1}
              dot={false}
              isAnimationActive={!loading}
            />
          </AreaChart>
        </ResponsiveContainer>

        {!loading && !hasData ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-800 bg-gray-950/40 text-sm text-gray-400">
            No data
          </div>
        ) : null}
      </div>
    </div>
  )
}

