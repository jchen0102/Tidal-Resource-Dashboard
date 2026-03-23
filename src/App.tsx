import { useMemo, useState } from 'react'
import { useTidalData } from './services/mockDataService'
import { TidalUtilTrendLineChart } from './components/TidalUtilTrendLineChart'
import { DeptModelStatsTable } from './components/DeptModelStatsTable'
import { TidalServiceDetailTable } from './components/TidalServiceDetailTable'
import { ElasticTaskTable } from './components/ElasticTaskTable'

type SelectOption = { value: string; label: string }

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-300">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-10 rounded-lg border border-white/10 bg-gray-900 px-3 text-sm text-gray-100 outline-none ring-0 transition focus:border-white/15 focus:bg-gray-900/70"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-gray-900">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function StatPanel({
  title,
  value,
  valueClassName,
  subtitle,
  right,
  bottom,
}: {
  title: string
  value: React.ReactNode
  valueClassName?: string
  subtitle?: React.ReactNode
  right?: React.ReactNode
  bottom?: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-gray-400">{title}</div>
          <div
            className={[
              'mt-2 text-2xl font-semibold tracking-tight text-gray-100',
              valueClassName ?? '',
            ].join(' ')}
          >
            {value}
          </div>
          {subtitle ? (
            <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      {bottom ? <div className="mt-3">{bottom}</div> : null}
    </section>
  )
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x))
}

function formatPct(x: number) {
  return `${Math.round(clamp01(x) * 100)}%`
}

function utilTone(util: number) {
  if (util < 0.2) return 'text-red-300'
  if (util < 0.4) return 'text-amber-300'
  return 'text-emerald-300'
}

function Panel({
  title,
  subtitle,
  right,
  children,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-gray-100">{title}</div>
          {subtitle ? (
            <div className="mt-0.5 text-xs text-gray-400">{subtitle}</div>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

export default function App() {
  const { data, loading } = useTidalData()
  const [selectedDept, setSelectedDept] = useState('all')
  const [selectedTime, setSelectedTime] = useState('24h')
  const filterOptions = useMemo(
    () => ({
      dept: [
        { value: 'all', label: '全部部门' },
        { value: 'inference', label: 'Online Inference' },
        { value: 'training', label: 'Offline Tidal Training' },
      ],
      time: [
        { value: '1h', label: '最近 1 小时' },
        { value: '6h', label: '最近 6 小时' },
        { value: '24h', label: '最近 24 小时' },
        { value: '7d', label: '最近 7 天' },
      ],
    }),
    [],
  )

  const gs = data?.globalStats
  const total = gs?.deptTotalGpus ?? 0
  const enabled = gs?.deptTidalEnabledGpus ?? 0
  const enabledPct = total > 0 ? enabled / total : 0
  const activeServices = gs?.deptTidalActiveServices ?? 0
  // 口径优化：
  // - `onlineBaselineUtil` 作为“部门未开启潮汐资源总利用率”（对照组/非潮汐口径）
  // - `combinedTidalUtil` 作为“部门资源总利用率”（开启潮汐后的整体口径）
  const nonTidalDeptUtil = gs?.onlineBaselineUtil ?? 0
  const deptTotalUtil = gs?.combinedTidalUtil ?? 0

  const filteredServiceDetail = useMemo(() => {
    const rows = data?.tidalServiceDetail ?? []
    if (selectedDept === 'all') return rows
    // Map header selection values to mock department labels
    const deptName =
      selectedDept === 'inference'
        ? '搜索推荐'
        : selectedDept === 'training'
          ? 'Offline Tidal Training'
          : selectedDept
    return rows.filter((r) => r.department === deptName)
  }, [data?.tidalServiceDetail, selectedDept])

  return (
    <div className="min-h-full bg-gray-950 text-gray-100">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
        {/* Top Header */}
        <header className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-lg font-semibold tracking-tight">
              潮汐算力集群监控看板
            </div>
            <div className="mt-1 text-xs text-gray-400">
              Tidal Compute Cluster Monitoring Dashboard（Demo）
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 md:gap-2">
              <div className="min-w-0 md:w-[200px]">
                <Select
                  label="部门筛选"
                  options={filterOptions.dept}
                  value={selectedDept}
                  onChange={setSelectedDept}
                />
              </div>
              <div className="min-w-0 md:w-[200px]">
                <Select
                  label="时间筛选"
                  options={filterOptions.time}
                  value={selectedTime}
                  onChange={setSelectedTime}
                />
              </div>
            </div>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-gray-900 text-sm font-semibold text-gray-100"
              aria-label="User profile"
              title="ERP 用户"
            >
              ERP
            </button>
          </div>
        </header>

        {/* Main Grid: 3 rows */}
        <main className="flex flex-col gap-4">
          {/* Row 1: 5 stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatPanel
              title="部门在线总卡数"
              value={
                loading ? (
                  <span className="inline-block h-7 w-20 animate-pulse rounded bg-white/10" />
                ) : (
                  total.toLocaleString()
                )
              }
              subtitle={<span className="text-gray-500">Total GPUs</span>}
            />

            <StatPanel
              title="部门开启潮汐总卡数"
              value={
                loading ? (
                  <span className="inline-block h-7 w-24 animate-pulse rounded bg-white/10" />
                ) : (
                  enabled.toLocaleString()
                )
              }
              subtitle={
                <span className="text-gray-500">
                  Enabled / Total · {formatPct(enabledPct)}
                </span>
              }
              bottom={
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-500/60"
                    style={{ width: `${Math.round(clamp01(enabledPct) * 100)}%` }}
                  />
                </div>
              }
            />

            <StatPanel
              title="部门开启潮汐服务总数"
              value={
                loading ? (
                  <span className="inline-block h-7 w-14 animate-pulse rounded bg-white/10" />
                ) : (
                  activeServices.toLocaleString()
                )
              }
              subtitle={<span className="text-gray-500">Active Services</span>}
            />

            <StatPanel
              title="未开启/开启潮汐资源利用率"
              value={
                loading ? (
                  <span className="inline-block h-7 w-28 animate-pulse rounded bg-white/10" />
                ) : (
                  <span className="text-xl">
                    <span className="text-blue-300">{formatPct(nonTidalDeptUtil)}</span>
                    <span className="mx-1 text-gray-500">/</span>
                    <span className="text-emerald-300">{formatPct(deptTotalUtil)}</span>
                  </span>
                )
              }
              subtitle={<span className="text-gray-500">未开启潮汐 / 开启潮汐</span>}
            />

            <StatPanel
              title="在线资源总利用率"
              value={
                loading ? (
                  <span className="inline-block h-7 w-16 animate-pulse rounded bg-white/10" />
                ) : (
                  formatPct(deptTotalUtil)
                )
              }
              valueClassName={utilTone(deptTotalUtil)}
              subtitle={<span className="text-gray-500">整体在线资源口径</span>}
            />
          </div>

          {/* Row 2: line chart */}
          <Panel
            title="部门潮汐服务资源利用率折线图 (24h)"
            subtitle="蓝线：未开启潮汐资源 · 绿线：开启潮汐资源"
            right={
              <span className="rounded-md border border-white/10 bg-gray-900 px-2 py-1 text-[11px] text-gray-300">
                Mock
              </span>
            }
          >
            <TidalUtilTrendLineChart
              data={data?.utilizationTrend ?? []}
              loading={loading}
            />
          </Panel>

          {/* Row 2.5: card stats */}
          <Panel
            title="部门与型号潮汐卡数统计"
            subtitle="按部门统计各型号开启潮汐卡数与在线服务卡数"
          >
            <DeptModelStatsTable data={filteredServiceDetail} loading={loading} />
          </Panel>

          {/* Row 3: table */}
          <Panel
            title="潮汐服务明细"
            subtitle="Tidal service details (sortable)"
            right={
              <div className="text-xs text-gray-400">
                Showing{' '}
                <span className="text-gray-200">
                  {loading ? '—' : filteredServiceDetail.length}
                </span>{' '}
                rows
              </div>
            }
          >
            <TidalServiceDetailTable
              data={filteredServiceDetail}
              loading={loading}
            />
          </Panel>

          <Panel
            title="弹性任务面板"
            subtitle="任务名、型号、卡数、利用率、ERP、部门、空间"
            right={
              <div className="text-xs text-gray-400">
                Showing{' '}
                <span className="text-gray-200">
                  {loading ? '—' : (data?.elasticTasks.length ?? 0)}
                </span>{' '}
                rows
              </div>
            }
          >
            <ElasticTaskTable
              data={data?.elasticTasks ?? []}
              loading={loading}
            />
          </Panel>
        </main>
      </div>
    </div>
  )
}
