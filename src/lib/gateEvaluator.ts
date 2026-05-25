import {
  defaultCouponScenarioInput,
  runCouponScenario,
  type CouponSafetyTarget,
  type CouponScenarioInput,
  type CouponScenarioResult,
  type ScenarioMode,
} from '../domain/coupon'

export type GateStatus = 'pass' | 'fail'
export type PilotDecisionLabel = 'Go' | 'No-Go' | 'Conditional Go'

export interface GateResult {
  id: string
  label: string
  status: GateStatus
  source: string
  observed: string
  expected: string
  detail: string
}

export interface PilotMetric {
  id: string
  label: string
  value: string
  status: GateStatus
}

export interface ModeExpectation extends CouponSafetyTarget {
  blocked: boolean
}

export interface HarnessConfig {
  scenario: string
  safeTarget: CouponSafetyTarget
  expectedModes: Record<ScenarioMode, ModeExpectation>
  requiredGates: string[]
  dataBoundary: {
    allowedDataClass: string
    allowedMemberIdPrefix: string
    allowedCouponPrefix: string
  }
  forbiddenPatterns: string[]
}

export interface OwnerService {
  id: string
  owner: string
  reviewRequired: boolean
  paths: string[]
}

export interface OwnerConfig {
  services: OwnerService[]
}

export interface ObservabilitySli {
  id: string
  label: string
  target: string
}

export interface ObservabilityAlert {
  id: string
  signal: string
  threshold: number
  channel: string
  owner: string
}

export interface ObservabilityConfig {
  slis: ObservabilitySli[]
  alerts: ObservabilityAlert[]
  dashboard: {
    name: string
    panels: string[]
  }
  reviewQueue: {
    p95Days: number
    source: string
  }
}

export interface DataBoundaryFixture extends CouponScenarioInput {
  dataClass: string
}

export interface HarnessArtifacts {
  harnessConfig: HarnessConfig
  ownersConfig: OwnerConfig
  observabilityConfig: ObservabilityConfig
  rollbackNote: string
  dataBoundaryFixture: DataBoundaryFixture
  artifactPaths: {
    harnessConfig: string
    ownersConfig: string
    observabilityConfig: string
    rollbackNote: string
    dataBoundaryFixture: string
  }
  missingArtifacts?: string[]
}

export interface ScenarioSli {
  id: string
  label: string
  status: GateStatus
  observed: string
  expected: string
}

export interface GateSummary {
  total: number
  failed: number
  blocked: boolean
}

export interface PilotDecision {
  decision: PilotDecisionLabel
  reasons: string[]
}

export interface CouponScenarioReport {
  mode: ScenarioMode
  request: CouponScenarioInput['request']
  couponResult: CouponScenarioResult
  sli: ScenarioSli[]
  gates: GateResult[]
  summary: GateSummary
  pilotMetrics: PilotMetric[]
  pilotDecision: PilotDecision
}

const requiredGateIds = [
  'scenario-reproduction',
  'coupon-idempotency',
  'harness-config',
  'owner-coverage',
  'rollback-ready',
  'data-boundary',
  'observability-ready',
  'forbidden-patterns',
]

export const fallbackHarnessConfig: HarnessConfig = {
  scenario: 'coupon-redeem-idempotency',
  safeTarget: {
    balanceDelta: -1,
    duplicateChargeDetected: false,
    reusedResult: true,
  },
  expectedModes: {
    buggy: {
      balanceDelta: -2,
      duplicateChargeDetected: true,
      reusedResult: false,
      blocked: true,
    },
    fixed: {
      balanceDelta: -1,
      duplicateChargeDetected: false,
      reusedResult: true,
      blocked: false,
    },
  },
  requiredGates: requiredGateIds,
  dataBoundary: {
    allowedDataClass: 'demo-only',
    allowedMemberIdPrefix: 'demo-user',
    allowedCouponPrefix: 'SPRING',
  },
  forbiddenPatterns: ['sk_live_', 'prod-log-', 'customer_email', 'resident_registration_number', 'Bearer ', 'BEGIN PRIVATE KEY'],
}

export const fallbackOwnerConfig: OwnerConfig = {
  services: [],
}

export const fallbackObservabilityConfig: ObservabilityConfig = {
  slis: [
    {
      id: 'duplicate-charge-rate',
      label: 'Duplicate charge count',
      target: '0 duplicate charges in fixed mode',
    },
    {
      id: 'retry-idempotency-rate',
      label: 'Retry idempotency pass rate',
      target: '100% for the same idempotencyKey in fixed mode',
    },
  ],
  alerts: [
    {
      id: 'duplicate-charge-alert',
      signal: 'duplicateChargeDetected',
      threshold: 0,
      channel: 'demo-pager',
      owner: 'coupon-service-owner',
    },
  ],
  dashboard: {
    name: 'Coupon Retry Safety',
    panels: ['duplicate charge count', 'retry idempotency pass rate', 'harness blocked state'],
  },
  reviewQueue: {
    p95Days: 0.8,
    source: 'demo pilot fixture',
  },
}

export const fallbackDataBoundaryFixture: DataBoundaryFixture = {
  ...defaultCouponScenarioInput,
  dataClass: 'demo-only',
}

export function createScenarioReport(mode: ScenarioMode, artifacts: HarnessArtifacts): CouponScenarioReport {
  const couponResult = runCouponScenario(mode, artifacts.dataBoundaryFixture)
  const reproductionSli = createReproductionSli(mode, couponResult, artifacts.harnessConfig)
  const gates = [
    evaluateScenarioReproduction(reproductionSli),
    evaluateCouponIdempotency(couponResult, artifacts.harnessConfig.safeTarget),
    evaluateHarnessConfig(artifacts),
    evaluateOwnerCoverage(artifacts),
    evaluateRollbackReadiness(artifacts),
    evaluateDataBoundary(artifacts),
    evaluateObservabilityReadiness(artifacts),
    evaluateForbiddenPatterns(artifacts),
  ]
  const summary = summarizeGates(gates)
  const sli = [
    ...reproductionSli,
    createSli('harness-blocked', 'Harness blocked state', summary.blocked, artifacts.harnessConfig.expectedModes[mode].blocked),
  ]
  const pilotMetrics = createPilotMetrics(gates, summary, artifacts.observabilityConfig)
  const pilotDecision = decidePilot(pilotMetrics)

  return {
    mode,
    request: couponResult.request,
    couponResult,
    sli,
    gates,
    summary,
    pilotMetrics,
    pilotDecision,
  }
}

export function summarizeGates(gates: GateResult[]): GateSummary {
  const failed = gates.filter((gate) => gate.status === 'fail')
  return {
    total: gates.length,
    failed: failed.length,
    blocked: failed.length > 0,
  }
}

export function decidePilot(metrics: PilotMetric[]): PilotDecision {
  const failed = metrics.filter((metric) => metric.status === 'fail')

  if (failed.some((metric) => metric.id === 'sensitive-data' || metric.id === 'checks')) {
    return {
      decision: 'No-Go',
      reasons: failed.map((metric) => metric.label),
    }
  }

  if (failed.length > 0) {
    return {
      decision: 'Conditional Go',
      reasons: failed.map((metric) => metric.label),
    }
  }

  return {
    decision: 'Go',
    reasons: ['all pilot gates are within target'],
  }
}

function createReproductionSli(
  mode: ScenarioMode,
  couponResult: CouponScenarioResult,
  harnessConfig: HarnessConfig,
): ScenarioSli[] {
  const expected = harnessConfig.expectedModes[mode]

  return [
    createSli('balance-delta', 'Balance delta', couponResult.balanceDelta, expected.balanceDelta),
    createSli(
      'duplicate-charge-detected',
      'Duplicate charge detected',
      couponResult.duplicateChargeDetected,
      expected.duplicateChargeDetected,
    ),
    createSli('reused-result', 'Reused first result', couponResult.reusedResult, expected.reusedResult),
  ]
}

function evaluateScenarioReproduction(sli: ScenarioSli[]): GateResult {
  const failed = sli.filter((item) => item.status === 'fail')

  return createGate({
    id: 'scenario-reproduction',
    label: 'Scenario reproduction',
    source: 'runner',
    passed: failed.length === 0,
    observed: failed.length === 0 ? 'mode output matches expected SLI' : failed.map((item) => item.id).join(', '),
    expected: 'buggy and fixed modes match config/harness.json expectations',
    detail: failed.length === 0 ? 'scenario runner reproduced the selected mode' : 'scenario runner output drifted from the configured SLI',
  })
}

function evaluateCouponIdempotency(couponResult: CouponScenarioResult, safeTarget: CouponSafetyTarget): GateResult {
  const passed =
    couponResult.balanceDelta === safeTarget.balanceDelta &&
    couponResult.duplicateChargeDetected === safeTarget.duplicateChargeDetected &&
    couponResult.reusedResult === safeTarget.reusedResult

  return createGate({
    id: 'coupon-idempotency',
    label: 'Affected unit tests',
    source: 'runner',
    passed,
    observed: formatSafetyTarget(couponResult),
    expected: formatSafetyTarget(safeTarget),
    detail: passed
      ? 'coupon.retry.idempotent passed against the in-memory domain runner'
      : 'coupon.retry.idempotent failed because the retry path double-decremented the balance',
  })
}

function evaluateHarnessConfig(artifacts: HarnessArtifacts): GateResult {
  const missingConfig = isMissing(artifacts, artifacts.artifactPaths.harnessConfig)
  const missingGates = requiredGateIds.filter((gateId) => !artifacts.harnessConfig.requiredGates.includes(gateId))
  const hasExpectedModes = Boolean(artifacts.harnessConfig.expectedModes.buggy && artifacts.harnessConfig.expectedModes.fixed)
  const passed = !missingConfig && missingGates.length === 0 && hasExpectedModes && artifacts.harnessConfig.forbiddenPatterns.length > 0

  return createGate({
    id: 'harness-config',
    label: 'Harness config',
    source: artifacts.artifactPaths.harnessConfig,
    passed,
    observed: missingConfig ? 'artifact missing' : `${artifacts.harnessConfig.requiredGates.length} configured gates`,
    expected: `${requiredGateIds.length} required gates and both mode expectations`,
    detail: passed ? 'config/harness.json defines SLO, mode expectations, and forbidden patterns' : formatConfigFailure(missingConfig, missingGates, hasExpectedModes),
  })
}

function evaluateOwnerCoverage(artifacts: HarnessArtifacts): GateResult {
  const missingOwners = isMissing(artifacts, artifacts.artifactPaths.ownersConfig)
  const service = artifacts.ownersConfig.services.find((item) => item.id === 'coupon-redeem')
  const passed = Boolean(
    !missingOwners &&
      service?.owner &&
      service.reviewRequired &&
      service.paths.includes('src/domain/coupon.ts') &&
      service.paths.includes('config/harness.json'),
  )

  return createGate({
    id: 'owner-coverage',
    label: 'Owner coverage',
    source: artifacts.artifactPaths.ownersConfig,
    passed,
    observed: missingOwners ? 'artifact missing' : service?.owner ?? 'owner missing',
    expected: 'coupon-redeem owner with reviewRequired=true and coupon/harness paths',
    detail: passed ? 'coupon service owner review is mapped to the touched artifacts' : 'owner config missing coupon-redeem coverage',
  })
}

function evaluateRollbackReadiness(artifacts: HarnessArtifacts): GateResult {
  const missingRollback = isMissing(artifacts, artifacts.artifactPaths.rollbackNote)
  const requiredSections = ['rollback trigger', 'owner', 'disable path', 'validation command']
  const note = artifacts.rollbackNote.toLowerCase()
  const missingSections = requiredSections.filter((section) => !note.includes(section))
  const passed = !missingRollback && missingSections.length === 0

  return createGate({
    id: 'rollback-ready',
    label: 'Rollback note',
    source: artifacts.artifactPaths.rollbackNote,
    passed,
    observed: missingRollback ? 'artifact missing' : missingSections.length === 0 ? 'all sections present' : `missing ${missingSections.join(', ')}`,
    expected: requiredSections.join(', '),
    detail: passed ? 'rollback trigger, owner, disable path, and validation command are documented' : 'rollback note is not ready for pilot use',
  })
}

function evaluateDataBoundary(artifacts: HarnessArtifacts): GateResult {
  const missingFixture = isMissing(artifacts, artifacts.artifactPaths.dataBoundaryFixture)
  const { request } = artifacts.dataBoundaryFixture
  const { dataBoundary } = artifacts.harnessConfig
  const passed =
    !missingFixture &&
    artifacts.dataBoundaryFixture.dataClass === dataBoundary.allowedDataClass &&
    request.memberId.startsWith(dataBoundary.allowedMemberIdPrefix) &&
    request.couponId.startsWith(dataBoundary.allowedCouponPrefix)

  return createGate({
    id: 'data-boundary',
    label: 'Data boundary',
    source: artifacts.artifactPaths.dataBoundaryFixture,
    passed,
    observed: missingFixture
      ? 'artifact missing'
      : `${artifacts.dataBoundaryFixture.dataClass}; ${request.memberId}; ${request.couponId}`,
    expected: `${dataBoundary.allowedDataClass}; ${dataBoundary.allowedMemberIdPrefix}*; ${dataBoundary.allowedCouponPrefix}*`,
    detail: passed ? 'fixture uses demo-only data inside the allowed boundary' : 'fixture contains data outside the approved demo boundary',
  })
}

function evaluateForbiddenPatterns(artifacts: HarnessArtifacts): GateResult {
  const searchableArtifacts = [
    JSON.stringify(artifacts.dataBoundaryFixture),
    JSON.stringify(artifacts.ownersConfig),
    artifacts.rollbackNote,
  ]
  const hits = artifacts.harnessConfig.forbiddenPatterns.filter((pattern) =>
    searchableArtifacts.some((artifactText) => artifactText.includes(pattern)),
  )
  const passed = hits.length === 0

  return createGate({
    id: 'forbidden-patterns',
    label: 'Forbidden patterns',
    source: 'config/harness.json forbiddenPatterns',
    passed,
    observed: passed ? '0 hits' : hits.join(', '),
    expected: '0 hits in fixture, owner config, and rollback note',
    detail: passed ? 'no secret/customer-data pattern was found in demo artifacts' : 'forbidden pattern detected in demo artifacts',
  })
}

function evaluateObservabilityReadiness(artifacts: HarnessArtifacts): GateResult {
  const missingObservability = isMissing(artifacts, artifacts.artifactPaths.observabilityConfig)
  const duplicateChargeAlert = artifacts.observabilityConfig.alerts.find(
    (alert) => alert.signal === 'duplicateChargeDetected' && alert.threshold === 0 && alert.owner === 'coupon-service-owner',
  )
  const retrySli = artifacts.observabilityConfig.slis.find((sli) => sli.id === 'retry-idempotency-rate')
  const hasDashboardPanel = artifacts.observabilityConfig.dashboard.panels.includes('duplicate charge count')
  const hasReviewSource = artifacts.observabilityConfig.reviewQueue.source.length > 0
  const passed = Boolean(!missingObservability && duplicateChargeAlert && retrySli && hasDashboardPanel && hasReviewSource)

  return createGate({
    id: 'observability-ready',
    label: 'Observability ready',
    source: artifacts.artifactPaths.observabilityConfig,
    passed,
    observed: missingObservability
      ? 'artifact missing'
      : `alerts=${artifacts.observabilityConfig.alerts.length}; dashboard=${artifacts.observabilityConfig.dashboard.name}; reviewSource=${artifacts.observabilityConfig.reviewQueue.source}`,
    expected: 'duplicateChargeDetected alert, retry idempotency SLI, dashboard panel, and review fixture source',
    detail: passed
      ? 'duplicate charge alert, retry SLI, dashboard, and review metric source are configured'
      : 'observability config is missing the alert, SLI, dashboard, or review metric source required for pilot Go',
  })
}

function createPilotMetrics(gates: GateResult[], summary: GateSummary, observabilityConfig: ObservabilityConfig): PilotMetric[] {
  const securityPassed = gatePassed(gates, 'data-boundary') && gatePassed(gates, 'forbidden-patterns')
  const ownerPassed = gatePassed(gates, 'owner-coverage')

  return [
    {
      id: 'sensitive-data',
      label: '금지 데이터 입력',
      value: securityPassed ? '0건' : 'blocked',
      status: securityPassed ? 'pass' : 'fail',
    },
    {
      id: 'owner-review',
      label: 'Owner review mapping',
      value: ownerPassed ? 'mapped' : 'missing',
      status: ownerPassed ? 'pass' : 'fail',
    },
    {
      id: 'checks',
      label: 'Required checks',
      value: summary.blocked ? `${summary.failed} failing gate(s)` : '100%',
      status: summary.blocked ? 'fail' : 'pass',
    },
    {
      id: 'review-p95',
      label: '리뷰 대기 p95',
      value: `${observabilityConfig.reviewQueue.p95Days}일 (${observabilityConfig.reviewQueue.source})`,
      status: 'pass',
    },
  ]
}

function createSli(id: string, label: string, observed: boolean | number, expected: boolean | number): ScenarioSli {
  return {
    id,
    label,
    status: observed === expected ? 'pass' : 'fail',
    observed: formatValue(observed),
    expected: formatValue(expected),
  }
}

function createGate({
  id,
  label,
  source,
  passed,
  observed,
  expected,
  detail,
}: {
  id: string
  label: string
  source: string
  passed: boolean
  observed: string
  expected: string
  detail: string
}): GateResult {
  return {
    id,
    label,
    source,
    status: passed ? 'pass' : 'fail',
    observed,
    expected,
    detail,
  }
}

function formatSafetyTarget(target: CouponSafetyTarget): string {
  return `balanceDelta=${target.balanceDelta}; duplicateChargeDetected=${target.duplicateChargeDetected}; reusedResult=${target.reusedResult}`
}

function formatValue(value: boolean | number): string {
  return String(value)
}

function formatConfigFailure(missingConfig: boolean, missingGates: string[], hasExpectedModes: boolean): string {
  if (missingConfig) {
    return 'harness config artifact is missing'
  }

  if (!hasExpectedModes) {
    return 'harness config must define buggy and fixed mode expectations'
  }

  if (missingGates.length > 0) {
    return `harness config missing required gates: ${missingGates.join(', ')}`
  }

  return 'harness config must define at least one forbidden pattern'
}

function isMissing(artifacts: HarnessArtifacts, path: string): boolean {
  return artifacts.missingArtifacts?.includes(path) ?? false
}

function gatePassed(gates: GateResult[], gateId: string): boolean {
  return gates.find((gate) => gate.id === gateId)?.status === 'pass'
}
