import type { ElasticTask } from '../services/mockDataService'

function formatPct(v: number) {
  return `${Math.round(v * 100)}%`
}

export function ElasticTaskTable({
  data,
  loading,
}: {
  data: ElasticTask
  loading?: boolean
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="min-w-[1000px] w-full table-fixed text-left text-sm">
        <thead className="bg-gray-900/70 text-xs text-gray-300">
          <tr className="border-b border-gray-800">
            <th className="w-[220px] px-3 py-2 font-medium">任务名</th>
            <th className="w-[110px] px-3 py-2 font-medium">型号</th>
            <th className="w-[110px] px-3 py-2 font-medium">卡数</th>
            <th className="w-[180px] px-3 py-2 font-medium">利用率</th>
            <th className="w-[140px] px-3 py-2 font-medium">ERP</th>
            <th className="w-[180px] px-3 py-2 font-medium">部门</th>
            <th className="w-[180px] px-3 py-2 font-medium">空间</th>
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
            : data.map((t, i) => (
                <tr
                  key={`${t.taskName}-${i}`}
                  className={[i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900', 'hover:bg-white/5'].join(
                    ' ',
                  )}
                >
                  <td className="px-3 py-2 font-medium text-gray-100">{t.taskName}</td>
                  <td className="px-3 py-2 text-gray-200">{t.gpuType}</td>
                  <td className="px-3 py-2 text-gray-200">{t.cardCount}</td>
                  <td className="px-3 py-2">
                    <div className="relative h-7 overflow-hidden rounded-md border border-gray-800 bg-gray-950/40">
                      <div
                        className="h-full bg-emerald-500/60"
                        style={{ width: `${Math.round(t.utilization * 100)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-100">
                        {formatPct(t.utilization)}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-200">{t.ownerErp}</td>
                  <td className="px-3 py-2 text-gray-200">{t.department}</td>
                  <td className="px-3 py-2 text-gray-200">{t.space}</td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}

