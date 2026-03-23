import { useMemo } from 'react'

import type { TidalServiceDetail } from '../services/mockDataService'

type Row = {
  department: string
  l40sTidalCards: number
  h800TidalCards: number
  l40sOnlineCards: number
  h800OnlineCards: number
  totalTidalCards: number
  totalOnlineCards: number
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
      const curr =
        map.get(r.department) ??
        {
          department: r.department,
          l40sTidalCards: 0,
          h800TidalCards: 0,
          l40sOnlineCards: 0,
          h800OnlineCards: 0,
          totalTidalCards: 0,
          totalOnlineCards: 0,
        }

      const isL40S = r.gpuType.toUpperCase() === 'L40S'
      const isH800 = r.gpuType.toUpperCase() === 'H800'
      // 业务口径：在线服务卡数应大于开启潮汐卡数（包含基础在线卡 + 潮汐增量）
      const onlineCards = Math.max(
        r.activeQuota + 1,
        Math.round(r.activeQuota * 1.35),
        r.avgOccupancy,
      )

      if (isL40S) {
        curr.l40sTidalCards += r.activeQuota
        curr.l40sOnlineCards += onlineCards
      } else if (isH800) {
        curr.h800TidalCards += r.activeQuota
        curr.h800OnlineCards += onlineCards
      }

      curr.totalTidalCards += r.activeQuota
      curr.totalOnlineCards += onlineCards

      map.set(r.department, curr)
    }
    return [...map.values()].sort((a, b) => b.totalTidalCards - a.totalTidalCards)
  }, [data])

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="min-w-[1450px] w-full table-fixed text-left text-sm">
        <thead className="bg-gray-900/70 text-xs text-gray-300">
          <tr className="border-b border-gray-800">
            <th className="w-[180px] px-3 py-2 font-medium">部门</th>
            <th className="w-[210px] px-3 py-2 font-medium">L40S 开启潮汐卡数</th>
            <th className="w-[210px] px-3 py-2 font-medium">H800 开启潮汐卡数</th>
            <th className="w-[210px] px-3 py-2 font-medium">L40S 在线服务卡数</th>
            <th className="w-[210px] px-3 py-2 font-medium">H800 在线服务卡数</th>
            <th className="w-[210px] px-3 py-2 font-medium">开启潮汐总卡数</th>
            <th className="w-[210px] px-3 py-2 font-medium">在线服务总卡数</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900'}>
                  {Array.from({ length: 7 }).map((__, j) => (
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
                  <td className="px-3 py-2 text-gray-200">{r.l40sTidalCards}</td>
                  <td className="px-3 py-2 text-gray-200">{r.h800TidalCards}</td>
                  <td className="px-3 py-2 text-gray-200">{r.l40sOnlineCards}</td>
                  <td className="px-3 py-2 text-gray-200">{r.h800OnlineCards}</td>
                  <td className="px-3 py-2 font-semibold text-gray-100">{r.totalTidalCards}</td>
                  <td className="px-3 py-2 font-semibold text-gray-100">{r.totalOnlineCards}</td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}

