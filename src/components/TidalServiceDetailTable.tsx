import { useMemo, useState } from 'react'

import type { TidalServiceDetail } from '../services/mockDataService'

type SortKey =
  | 'ownerErp'
  | 'department'
  | 'source'
  | 'system'
  | 'serviceName'
  | 'application'
  | 'group'
  | 'gpuType'
  | 'activeQuota'
  | 'avgOccupancy'
  | 'tidalTotalUtil'
  | 'nonTidalUtil'
  | 'modelName'
  | 'modelOwner'
  | 'goldenWindow'
  | 'tidalStatus'
  | 'yesterdayCardHours'

type SortDir = 'asc' | 'desc'

function pct01(x: number) {
  const v = Math.max(0, Math.min(1, x))
  return Math.round(v * 100)
}

function cmp(a: string | number, b: string | number) {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

function sortArrow(active: boolean, dir: SortDir) {
  if (!active) return <span className="text-gray-600">↕</span>
  return dir === 'asc' ? (
    <span className="text-gray-200">↑</span>
  ) : (
    <span className="text-gray-200">↓</span>
  )
}

function StatusBadge({ status }: { status: TidalServiceDetail[number]['tidalStatus'] }) {
  const cls =
    status === 'Active'
      ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/25'
      : status === 'Evicting'
        ? 'bg-red-500/15 text-red-200 ring-red-500/25'
        : 'bg-white/10 text-gray-200 ring-white/10'

  const label = status === 'Evicting' ? 'Evicting / Melted' : status

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${cls}`}>
      {label}
    </span>
  )
}

function BarGauge({
  value,
  max,
  tone = 'bg-sky-500/55',
}: {
  value: number
  max: number
  tone?: string
}) {
  const p = max <= 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="relative h-7 w-full overflow-hidden rounded-md border border-gray-800 bg-gray-950/40">
      <div className={`h-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, p))}%` }} />
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-100">
        {value.toLocaleString()}
      </div>
    </div>
  )
}

function MiniPctBar({
  value,
  tone = 'bg-emerald-500/55',
}: {
  value: number
  tone?: string
}) {
  const p = pct01(value)
  return (
    <div className="relative h-7 w-full overflow-hidden rounded-md border border-gray-800 bg-gray-950/40">
      <div className={`h-full ${tone}`} style={{ width: `${p}%` }} />
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-100">
        {p}%
      </div>
    </div>
  )
}

export function TidalServiceDetailTable({
  data,
  loading,
}: {
  data: TidalServiceDetail
  loading?: boolean
}) {
  const [sortKey, setSortKey] = useState<SortKey>('yesterdayCardHours')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const maxCardHours = useMemo(
    () => data.reduce((m, r) => Math.max(m, r.yesterdayCardHours), 0),
    [data],
  )

  const appDescriptions = useMemo(() => {
    const map = new Map<string, string>()
    map.set('inference-gateway', 'Online entrypoint for real-time inference traffic and routing.')
    map.set('ranker-rt', 'Low-latency ranking service for online recommendations.')
    map.set('vision-embedder', 'Image/video embedding service (multi-tenant, bursty workloads).')
    map.set('multimodal-chat', 'Interactive multimodal chat serving (peak hour sensitive).')
    map.set('tidal-trainer-xl', 'Offline tidal training job (GPU-hungry, valley-filling candidate).')
    map.set('tidal-trainer-base', 'Offline training baseline jobs (moderate GPU demand).')
    map.set('batch-eval', 'Batch evaluation pipeline with intermittent spikes.')
    map.set('feature-gen', 'Offline feature generation and refresh cycles.')
    map.set('offline-distill', 'Knowledge distillation jobs (large batch, tolerant to evictions).')
    map.set('etl-preprocess', 'Preprocessing / ETL stage for training datasets.')
    return map
  }, [])

  const sorted = useMemo(() => {
    const rows = [...data]
    rows.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const av = a[sortKey]
      const bv = b[sortKey]
      return dir * cmp(av as never, bv as never)
    })
    return rows
  }, [data, sortDir, sortKey])

  function toggleSort(next: SortKey) {
    if (next === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(next)
      setSortDir(
        next === 'ownerErp' ||
          next === 'serviceName' ||
          next === 'department' ||
          next === 'source' ||
          next === 'system' ||
          next === 'application' ||
          next === 'group' ||
          next === 'modelName' ||
          next === 'modelOwner' ||
          next === 'goldenWindow'
          ? 'asc'
          : 'desc',
      )
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="min-w-[1450px] w-full table-fixed text-left text-sm">
        <thead className="bg-gray-900/70 text-xs text-gray-300">
          <tr className="border-b border-gray-800">
            {[
              { key: 'ownerErp', label: '负责人（ERP）', w: 'w-[140px]' },
              { key: 'department', label: '部门', w: 'w-[140px]' },
              { key: 'source', label: '来源', w: 'w-[110px]' },
              { key: 'system', label: '系统', w: 'w-[160px]' },
              { key: 'serviceName', label: '服务/App', w: 'w-[220px]' },
              { key: 'application', label: '应用', w: 'w-[140px]' },
              { key: 'group', label: '组', w: 'w-[140px]' },
              { key: 'gpuType', label: '卡型号', w: 'w-[90px]' },
              { key: 'activeQuota', label: '开启潮汐卡数', w: 'w-[140px]' },
              { key: 'avgOccupancy', label: '平均占用', w: 'w-[120px]' },
              { key: 'tidalTotalUtil', label: '潮汐后总利用率', w: 'w-[190px]' },
              { key: 'nonTidalUtil', label: '非潮汐时段利用率', w: 'w-[190px]' },
              { key: 'modelName', label: '模型名称', w: 'w-[160px]' },
              { key: 'modelOwner', label: '模型负责人', w: 'w-[140px]' },
              { key: 'goldenWindow', label: '潮汐开启时间段', w: 'w-[170px]' },
              { key: 'tidalStatus', label: '潮汐状态', w: 'w-[150px]' },
              { key: 'yesterdayCardHours', label: '累积贡献卡时', w: 'w-[220px]' },
            ].map((c) => {
              const key = c.key as SortKey
              const active = key === sortKey
              return (
                <th key={c.key} className={`px-3 py-2 font-medium ${c.w}`}>
                  <button
                    type="button"
                    onClick={() => toggleSort(key)}
                    className="inline-flex w-full items-center justify-between gap-2 text-left hover:text-gray-100"
                  >
                    <span>{c.label}</span>
                    <span className="text-xs">{sortArrow(active, sortDir)}</span>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-800">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900'}
                >
                  {Array.from({ length: 16 }).map((__, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-5 w-full animate-pulse rounded bg-white/10" />
                    </td>
                  ))}
                </tr>
              ))
            : sorted.map((r, idx) => {
                const appDesc = appDescriptions.get(r.serviceName) ?? r.serviceName

                return (
                  <tr
                    key={`${r.ownerErp}-${r.serviceName}-${idx}`}
                    className={[
                      idx % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900',
                      'hover:bg-white/5',
                    ].join(' ')}
                  >
                    <td className="px-3 py-2 font-medium text-gray-100">
                      {r.ownerErp}
                    </td>
                    <td className="px-3 py-2 text-gray-200">{r.department}</td>
                    <td className="px-3 py-2 text-gray-200">{r.source}</td>
                    <td className="px-3 py-2 text-gray-200">{r.system}</td>
                    <td className="px-3 py-2">
                      <span
                        title={appDesc}
                        className="inline-flex max-w-full cursor-help items-center gap-2"
                      >
                        <span className="truncate font-medium text-sky-300 underline decoration-sky-400/60 underline-offset-2">
                          {r.serviceName}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-200">{r.application}</td>
                    <td className="px-3 py-2 text-gray-200">{r.group}</td>
                    <td className="px-3 py-2 text-gray-200">{r.gpuType}</td>
                    <td className="px-3 py-2 text-gray-200 tabular-nums">{r.activeQuota}</td>
                    <td className="px-3 py-2 text-gray-200 tabular-nums">
                      {r.avgOccupancy.toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <MiniPctBar value={r.tidalTotalUtil} tone="bg-emerald-500/55" />
                    </td>
                    <td className="px-3 py-2">
                      <MiniPctBar value={r.nonTidalUtil} tone="bg-sky-500/45" />
                    </td>
                    <td className="px-3 py-2 text-gray-200">{r.modelName}</td>
                    <td className="px-3 py-2 text-gray-200">{r.modelOwner}</td>
                    <td className="px-3 py-2 text-gray-200">{r.goldenWindow}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={r.tidalStatus} />
                    </td>
                    <td className="px-3 py-2">
                      <BarGauge
                        value={r.yesterdayCardHours}
                        max={maxCardHours}
                        tone="bg-sky-500/55"
                      />
                    </td>
                  </tr>
                )
              })}
        </tbody>
      </table>
    </div>
  )
}

