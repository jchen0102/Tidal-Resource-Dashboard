import { useMemo } from 'react'

import type { TidalServiceDetail } from '../services/mockDataService'

type ModelCoverage = {
  model: 'L40S' | 'H800'
  enabledCards: number
  totalCards: number
  disabledCards: number
  enabledRatio: number
}

type DeptCoverage = {
  department: string
  totalEnabled: number
  totalCards: number
  totalDisabled: number
  enabledRatio: number
  models: ModelCoverage[]
}

function pct(x: number) {
  return `${Math.round(x * 100)}%`
}

function buildCoverage(data: TidalServiceDetail): DeptCoverage[] {
  type Acc = {
    department: string
    models: Record<'L40S' | 'H800', { enabled: number; total: number }>
  }

  const byDept = new Map<string, Acc>()

  for (const r of data) {
    const model = r.gpuType.toUpperCase() === 'H800' ? 'H800' : 'L40S'
    const acc =
      byDept.get(r.department) ??
      ({
        department: r.department,
        models: {
          L40S: { enabled: 0, total: 0 },
          H800: { enabled: 0, total: 0 },
        },
      } satisfies Acc)

    acc.models[model].enabled += r.activeQuota
    // 统一口径：总卡数 >= 开启潮汐卡数，且基于在线服务规模估算可开启池
    const estimatedTotal = Math.max(
      r.activeQuota + 1,
      Math.round(r.avgOccupancy * 1.15),
      Math.round(r.activeQuota * 1.35),
    )
    acc.models[model].total += estimatedTotal

    byDept.set(r.department, acc)
  }

  return [...byDept.values()]
    .map((d) => {
      const mL40S = d.models.L40S
      const mH800 = d.models.H800

      const models: ModelCoverage[] = (['L40S', 'H800'] as const).map((m) => {
        const enabledCards = d.models[m].enabled
        const totalCards = d.models[m].total
        const disabledCards = Math.max(0, totalCards - enabledCards)
        const enabledRatio = totalCards > 0 ? enabledCards / totalCards : 0
        return { model: m, enabledCards, totalCards, disabledCards, enabledRatio }
      })

      const totalEnabled = mL40S.enabled + mH800.enabled
      const totalCards = mL40S.total + mH800.total
      const totalDisabled = Math.max(0, totalCards - totalEnabled)
      const enabledRatio = totalCards > 0 ? totalEnabled / totalCards : 0

      return {
        department: d.department,
        totalEnabled,
        totalCards,
        totalDisabled,
        enabledRatio,
        models,
      }
    })
    .sort((a, b) => b.totalEnabled - a.totalEnabled)
}

function ratioTone(ratio: number) {
  if (ratio >= 0.7) return 'text-emerald-300'
  if (ratio >= 0.4) return 'text-amber-300'
  return 'text-red-300'
}

export function DeptModelTidalCoverage({
  data,
  loading,
}: {
  data: TidalServiceDetail
  loading?: boolean
}) {
  const rows = useMemo(() => buildCoverage(data), [data])

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
        <div className="flex items-center gap-4 text-xs text-gray-300">
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span>已开启潮汐</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-600" />
            <span>未开启潮汐</span>
          </div>
        </div>
      </div>

      {loading
        ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-950/40 p-4">
              <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
              <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/10" />
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="h-14 animate-pulse rounded bg-white/10" />
                <div className="h-14 animate-pulse rounded bg-white/10" />
              </div>
            </div>
          ))
        : rows.map((dept) => (
            <section
              key={dept.department}
              className="rounded-xl border border-gray-800 bg-gray-950/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-100">{dept.department}</div>
                  <div className="mt-1 text-xs text-gray-400">
                    开启 {dept.totalEnabled} / 总量 {dept.totalCards} Cards
                  </div>
                </div>
                <div className={`text-sm font-semibold ${ratioTone(dept.enabledRatio)}`}>
                  {pct(dept.enabledRatio)}
                </div>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full bg-emerald-500/80"
                  style={{ width: `${Math.round(dept.enabledRatio * 100)}%` }}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                {dept.models.map((m) => (
                  <div
                    key={`${dept.department}-${m.model}`}
                    className="rounded-lg border border-gray-800 bg-gray-900/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-medium text-gray-300">{m.model}</div>
                      <div className="text-xs text-gray-400">
                        {m.enabledCards}/{m.totalCards} · {pct(m.enabledRatio)}
                      </div>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-800">
                      <div
                        className="h-full bg-emerald-500/80"
                        style={{ width: `${Math.round(m.enabledRatio * 100)}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                      <span>开启: {m.enabledCards}</span>
                      <span>未开启: {m.disabledCards}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
    </div>
  )
}

