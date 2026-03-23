import { useMemo } from 'react'

import type { TidalServiceDetail } from '../services/mockDataService'

type Row = {
  department: string
  gpuType: 'L40S' | 'H800'
  tidalCards: number
  onlineCards: number
}

export function DeptModelStatsTable({
  data,
  loading,
}: {
  data: TidalServiceDetail
  loading?: boolean
}) {
  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>()
    for (const r of data) {
      const gpuType: 'L40S' | 'H800' = r.gpuType.toUpperCase() === 'H800' ? 'H800' : 'L40S'
      const key = `${r.department}__${gpuType}`
      const curr = map.get(key) ?? {
        department: r.department,
        gpuType,
        tidalCards: 0,
        onlineCards: 0,
      }
      // 业务口径：在线服务卡数应大于开启潮汐卡数（包含基础在线卡 + 潮汐增量）
      const onlineCards = Math.max(
        r.activeQuota + 1,
        Math.round(r.activeQuota * 1.35),
        r.avgOccupancy,
      )

      curr.tidalCards += r.activeQuota
      curr.onlineCards += onlineCards
      map.set(key, curr)
    }
    return [...map.values()].sort((a, b) =>
      a.department === b.department
        ? a.gpuType.localeCompare(b.gpuType)
        : b.tidalCards - a.tidalCards,
    )
  }, [data])

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="min-w-[680px] w-full table-fixed text-left text-sm">
        <thead className="bg-gray-900/70 text-xs text-gray-300">
          <tr className="border-b border-gray-800">
            <th className="w-[180px] px-3 py-2 font-medium">部门</th>
            <th className="w-[120px] px-3 py-2 font-medium">型号</th>
            <th className="w-[180px] px-3 py-2 font-medium">开启潮汐卡数</th>
            <th className="w-[180px] px-3 py-2 font-medium">在线服务卡数</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900'}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-5 w-full animate-pulse rounded bg-white/10" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((r, i) => (
                <tr
                  key={r.department}
                  className={[i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900', 'hover:bg-white/5'].join(
                    ' ',
                  )}
                >
                  <td className="px-3 py-2 font-medium text-gray-100">{r.department}</td>
                  <td className="px-3 py-2 text-gray-200">{r.gpuType}</td>
                  <td className="px-3 py-2 font-semibold text-gray-100">{r.tidalCards}</td>
                  <td className="px-3 py-2 font-semibold text-gray-100">{r.onlineCards}</td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}

