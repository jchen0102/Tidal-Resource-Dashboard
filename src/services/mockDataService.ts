import { useEffect, useMemo, useState } from 'react'

export interface TidalGlobalStats {
  /** 部门在线总卡数 */
  deptTotalGpus: number
  /** 部门开启潮汐总卡数 */
  deptTidalEnabledGpus: number
  /** 部门开启潮汐服务总数 */
  deptTidalActiveServices: number
  /** 在线资源总利用率 (Baseline), 0-1 */
  onlineBaselineUtil: number
  /** 开启潮汐资源总利用率 (Target), 0-1 */
  combinedTidalUtil: number
}

export type DeptDistribution = Array<{
  deptName: string
  tidalGpus: number
  percentage: number
}>

export type TidalUtilizationTrend = Array<{
  /** HH:mm */
  time: string
  onlineUtil: number
  tidalUtil: number
}>

export type TidalServiceDetail = Array<{
  /** 负责人 (ERP) */
  ownerErp: string
  /** 部门 */
  department: string
  /** 来源 */
  source: string
  /** 系统 */
  system: string
  /** 服务/App (对外展示名) */
  serviceName: string
  /** 应用 (更具体的应用/模块名) */
  application: string
  /** 组 */
  group: string
  /** 卡型号 */
  gpuType: string
  /** 平均占用 (cards) */
  avgOccupancy: number
  /** 潮汐后总利用率, 0-1 */
  tidalTotalUtil: number
  /** 非潮汐时间段利用率, 0-1 */
  nonTidalUtil: number
  /** region */
  region: string
  /** 模型名称 */
  modelName: string
  /** 模型负责人 */
  modelOwner: string
  /** 显存利用率, 0-1 */
  vramUtil: number
  /** Active quota (cards) */
  activeQuota: number
  tidalStatus: 'Active' | 'Inactive' | 'Evicting'
  /** 0-1 */
  volatility: number
  goldenWindow: string
  yesterdayCardHours: number
  recentEvictions: number
}>

/** 弹性任务（Mock） */
export type ElasticTask = Array<{
  /** 任务名 */
  taskName: string
  /** 型号 */
  gpuType: string
  /** 卡数 */
  cardCount: number
  /** 利用率 0-1 */
  utilization: number
  /** ERP */
  ownerErp: string
  /** 部门 */
  department: string
  /** 空间（命名空间 / 工作空间） */
  space: string
}>

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x))
}

function fmtHour(h: number) {
  const hh = String(h).padStart(2, '0')
  return `${hh}:00`
}

function range(n: number) {
  return Array.from({ length: n }, (_, i) => i)
}

function seededUnit(i: number) {
  // Deterministic pseudo-random in [0, 1)
  const x = Math.sin(i * 999.123 + 0.12345) * 10000
  return x - Math.floor(x)
}

function makeGlobalStats(): TidalGlobalStats {
  // L40S/H800-flavored cluster defaults
  const deptTotalGpus = 300
  const deptTidalEnabledGpus = 120
  const deptTidalActiveServices = 18

  // Keep util realistic and consistent with "valley fill" story
  const onlineBaselineUtil = 0.58
  const combinedTidalUtil = 0.76

  return {
    deptTotalGpus,
    deptTidalEnabledGpus,
    deptTidalActiveServices,
    onlineBaselineUtil,
    combinedTidalUtil,
  }
}

function makeDeptDistribution(totalTidalGpus: number): DeptDistribution {
  // Roughly realistic dept mix; percentages are based on tidalGpus / totalTidalGpus.
  const raw = [
    { deptName: 'XR产品部', tidalGpus: 54 },
    { deptName: '搜索推荐', tidalGpus: 26 },
    { deptName: '多模态平台', tidalGpus: 22 },
    { deptName: 'AIGC应用', tidalGpus: 18 },
  ]

  const sum = raw.reduce((acc, d) => acc + d.tidalGpus, 0)
  const scale = sum === 0 ? 0 : totalTidalGpus / sum
  const scaled = raw.map((d) => ({
    ...d,
    tidalGpus: Math.max(0, Math.round(d.tidalGpus * scale)),
  }))

  // Fix rounding drift to match totalTidalGpus.
  let drift = totalTidalGpus - scaled.reduce((acc, d) => acc + d.tidalGpus, 0)
  for (let i = 0; i < scaled.length && drift !== 0; i++) {
    const delta = drift > 0 ? 1 : -1
    scaled[i] = { ...scaled[i], tidalGpus: Math.max(0, scaled[i].tidalGpus + delta) }
    drift -= delta
  }

  return scaled.map((d) => ({
    ...d,
    percentage: totalTidalGpus === 0 ? 0 : d.tidalGpus / totalTidalGpus,
  }))
}

function makeUtilTrend(
  baselineUtil: number,
  combinedTarget: number,
): TidalUtilizationTrend {
  // 24 points hourly. Low online util during 02:00-06:00, tidal fills valley.
  return range(24).map((h) => {
    const valley = h >= 2 && h <= 6
    const peak = h >= 10 && h <= 18

    // Online util: valley low, peak higher, otherwise near baseline with small jitter.
    const jitter = (seededUnit(h) - 0.5) * 0.06
    const onlineUtil = clamp01(
      valley ? 0.28 + jitter : peak ? baselineUtil + 0.18 + jitter : baselineUtil + jitter,
    )

    // Tidal util should be >= online in valley (fill), otherwise close to combined target.
    const fillBoost = valley ? 0.38 + (seededUnit(h + 7) - 0.5) * 0.08 : 0.0
    const tidalUtil = clamp01(
      Math.max(onlineUtil, combinedTarget + (seededUnit(h + 13) - 0.5) * 0.05) + fillBoost,
    )

    return {
      time: fmtHour(h),
      onlineUtil,
      tidalUtil,
    }
  })
}

function makeServiceDetails(): TidalServiceDetail {
  const services = [
    {
      ownerErp: 'li.wei',
      department: '搜索推荐',
      source: 'Online',
      system: 'Realtime Inference',
      serviceName: 'inference-gateway',
      application: 'gateway-router',
      group: 'search-infra',
      gpuType: 'L40S',
      activeQuota: 16,
      modelName: 'ranker-v3',
      modelOwner: 'wang.yu',
      region: 'cn-shanghai',
    },
    {
      ownerErp: 'wang.yu',
      department: '搜索推荐',
      source: 'Online',
      system: 'Realtime Inference',
      serviceName: 'ranker-rt',
      application: 'ranker',
      group: 'search-ranking',
      gpuType: 'L40S',
      activeQuota: 24,
      modelName: 'ranker-v3',
      modelOwner: 'wang.yu',
      region: 'cn-beijing',
    },
    {
      ownerErp: 'chen.hao',
      department: '多模态平台',
      source: 'Online',
      system: 'Embedding Service',
      serviceName: 'vision-embedder',
      application: 'vision-encoder',
      group: 'mm-platform',
      gpuType: 'H800',
      activeQuota: 32,
      modelName: 'clip-xxl',
      modelOwner: 'chen.hao',
      region: 'cn-shanghai',
    },
    {
      ownerErp: 'zhao.qi',
      department: 'AIGC应用',
      source: 'Online',
      system: 'Chat Serving',
      serviceName: 'multimodal-chat',
      application: 'chat-orchestrator',
      group: 'aigc-app',
      gpuType: 'H800',
      activeQuota: 48,
      modelName: 'tidal-llm-70b',
      modelOwner: 'zhao.qi',
      region: 'cn-shanghai',
    },
    {
      ownerErp: 'sun.jie',
      department: 'Offline Tidal Training',
      source: 'Offline',
      system: 'Training Platform',
      serviceName: 'tidal-trainer-xl',
      application: 'trainer',
      group: 'tidal-train',
      gpuType: 'H800',
      activeQuota: 64,
      modelName: 'vlm-pretrain-xl',
      modelOwner: 'sun.jie',
      region: 'cn-beijing',
    },
    {
      ownerErp: 'liu.nan',
      department: 'Offline Tidal Training',
      source: 'Offline',
      system: 'Training Platform',
      serviceName: 'tidal-trainer-base',
      application: 'trainer',
      group: 'tidal-train',
      gpuType: 'L40S',
      activeQuota: 40,
      modelName: 'ranker-distill-v2',
      modelOwner: 'liu.nan',
      region: 'cn-shanghai',
    },
    {
      ownerErp: 'yang.fei',
      department: 'XR产品部',
      source: 'Offline',
      system: 'Batch Eval',
      serviceName: 'batch-eval',
      application: 'eval-pipeline',
      group: 'xr-lab',
      gpuType: 'L40S',
      activeQuota: 20,
      modelName: 'avatar-gen-v1',
      modelOwner: 'yang.fei',
      region: 'cn-shanghai',
    },
    {
      ownerErp: 'he.xin',
      department: 'XR产品部',
      source: 'Offline',
      system: 'Feature Pipeline',
      serviceName: 'feature-gen',
      application: 'feature-refresh',
      group: 'xr-lab',
      gpuType: 'L40S',
      activeQuota: 12,
      modelName: 'motion-embed-v2',
      modelOwner: 'he.xin',
      region: 'cn-beijing',
    },
    {
      ownerErp: 'zhou.ming',
      department: '多模态平台',
      source: 'Offline',
      system: 'Distillation',
      serviceName: 'offline-distill',
      application: 'distill-worker',
      group: 'mm-platform',
      gpuType: 'H800',
      activeQuota: 56,
      modelName: 'clip-distill-l',
      modelOwner: 'zhou.ming',
      region: 'cn-shanghai',
    },
    {
      ownerErp: 'gao.yan',
      department: 'AIGC应用',
      source: 'Offline',
      system: 'ETL / Preprocess',
      serviceName: 'etl-preprocess',
      application: 'dataset-etl',
      group: 'aigc-app',
      gpuType: 'L40S',
      activeQuota: 8,
      modelName: 'tidal-llm-7b',
      modelOwner: 'gao.yan',
      region: 'cn-beijing',
    },
  ]

  return services.map((s, i) => {
    const r = seededUnit(i + 101)
    const tidalStatus: 'Active' | 'Inactive' | 'Evicting' =
      r < 0.68 ? 'Active' : r < 0.88 ? 'Inactive' : 'Evicting'

    const volatility = clamp01(0.15 + seededUnit(i + 303) * 0.75)

    const avgOccupancy = Math.max(
      1,
      Math.round(s.activeQuota * (0.55 + seededUnit(i + 111) * 0.55)),
    )

    const nonTidalUtil = clamp01(0.12 + seededUnit(i + 222) * 0.62)
    const tidalFill = clamp01(0.18 + volatility * 0.55 + seededUnit(i + 333) * 0.18)
    const tidalTotalUtil = clamp01(Math.max(nonTidalUtil, nonTidalUtil + tidalFill))

    const vramUtil = clamp01(0.25 + seededUnit(i + 444) * 0.7)

    // Golden windows skew to night hours; evictions higher with volatility + status.
    const start = 1 + Math.floor(seededUnit(i + 501) * 4) // 01-04
    const end = 6 + Math.floor(seededUnit(i + 777) * 3) // 06-08
    const goldenWindow = `${String(start).padStart(2, '0')}:00 - ${String(end).padStart(2, '0')}:00`

    const yesterdayCardHoursBase = s.activeQuota * (tidalStatus === 'Inactive' ? 2.5 : 6.5)
    const yesterdayCardHours = Math.round(
      yesterdayCardHoursBase * (0.75 + seededUnit(i + 909) * 0.7),
    )

    const recentEvictions =
      tidalStatus === 'Evicting'
        ? 2 + Math.floor(volatility * 6)
        : tidalStatus === 'Active'
          ? Math.floor(volatility * 3)
          : 0

    return {
      ...s,
      avgOccupancy,
      tidalTotalUtil,
      nonTidalUtil,
      vramUtil,
      tidalStatus,
      volatility,
      goldenWindow,
      yesterdayCardHours,
      recentEvictions,
    }
  })
}

function makeElasticTasks(): ElasticTask {
  const tasks = [
    {
      taskName: 'elastic-pretrain-01',
      gpuType: 'H800',
      cardCount: 32,
      department: '多模态平台',
      ownerErp: 'chen.hao',
      space: 'mm-prod-ns',
    },
    {
      taskName: 'elastic-ranker-burst',
      gpuType: 'L40S',
      cardCount: 16,
      department: '搜索推荐',
      ownerErp: 'wang.yu',
      space: 'search-gpu-ns',
    },
    {
      taskName: 'elastic-distill-night',
      gpuType: 'H800',
      cardCount: 48,
      department: '多模态平台',
      ownerErp: 'zhou.ming',
      space: 'mm-train-ns',
    },
    {
      taskName: 'elastic-aigc-batch',
      gpuType: 'L40S',
      cardCount: 24,
      department: 'AIGC应用',
      ownerErp: 'zhao.qi',
      space: 'aigc-prod-ns',
    },
    {
      taskName: 'elastic-xr-eval',
      gpuType: 'L40S',
      cardCount: 8,
      department: 'XR产品部',
      ownerErp: 'yang.fei',
      space: 'xr-lab-ns',
    },
  ]

  return tasks.map((t, i) => ({
    ...t,
    utilization: clamp01(0.45 + seededUnit(i + 200) * 0.45),
  }))
}

function buildMockPayload() {
  const globalStats = makeGlobalStats()
  const deptDistribution = makeDeptDistribution(globalStats.deptTidalEnabledGpus)
  const utilizationTrend = makeUtilTrend(
    globalStats.onlineBaselineUtil,
    globalStats.combinedTidalUtil,
  )
  const tidalServiceDetail = makeServiceDetails()
  const elasticTasks = makeElasticTasks()

  return {
    globalStats,
    deptDistribution,
    utilizationTrend,
    tidalServiceDetail,
    elasticTasks,
  }
}

export function useTidalData() {
  const payload = useMemo(() => buildMockPayload(), [])
  const [data, setData] = useState<typeof payload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ms = 420 + Math.floor(seededUnit(42) * 260)
    const t = window.setTimeout(() => {
      setData(payload)
      setLoading(false)
    }, ms)
    return () => window.clearTimeout(t)
  }, [payload])

  return { data, loading }
}

