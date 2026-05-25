export type GateStatus = 'pass' | 'fail'

export interface GateResult {
  id: string
  label: string
  status: GateStatus
  detail: string
}

export interface PilotMetric {
  id: string
  label: string
  value: string
  status: GateStatus
}

export function evaluateHarness(patchApplied: boolean): GateResult[] {
  return [
    {
      id: 'unit',
      label: 'Affected unit tests',
      status: patchApplied ? 'pass' : 'fail',
      detail: patchApplied ? 'retry and already-used tests passed' : 'coupon.retry.idempotent failed',
    },
    {
      id: 'label',
      label: 'AI PR label',
      status: 'pass',
      detail: 'ai-assisted label attached',
    },
    {
      id: 'owner',
      label: 'CODEOWNERS review',
      status: 'pass',
      detail: 'coupon service owner approved',
    },
    {
      id: 'secret',
      label: 'Secret scan',
      status: 'pass',
      detail: 'no secret or customer data found',
    },
    {
      id: 'rollback',
      label: 'Rollback note',
      status: 'pass',
      detail: 'feature flag and rollback owner documented',
    },
  ]
}

export function summarizeGates(gates: GateResult[]) {
  const failed = gates.filter((gate) => gate.status === 'fail')
  return {
    total: gates.length,
    failed: failed.length,
    blocked: failed.length > 0,
  }
}

export function decidePilot(metrics: PilotMetric[]) {
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
