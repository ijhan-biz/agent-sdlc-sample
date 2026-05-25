import { describe, expect, it } from 'vitest'
import { demoHarnessArtifacts } from '../data/harnessArtifacts'
import { createScenarioReport, decidePilot, summarizeGates } from './gateEvaluator'

describe('gate evaluator', () => {
  it('blocks the harness for the real buggy scenario', () => {
    const report = createScenarioReport('buggy', demoHarnessArtifacts)

    expect(report.couponResult.balanceDelta).toBe(-2)
    expect(report.summary.blocked).toBe(true)
    expect(report.gates.find((gate) => gate.id === 'coupon-idempotency')?.status).toBe('fail')
  })

  it('passes the harness for the real fixed scenario', () => {
    const report = createScenarioReport('fixed', demoHarnessArtifacts)

    expect(report.couponResult.balanceDelta).toBe(-1)
    expect(report.summary.blocked).toBe(false)
    expect(report.gates.every((gate) => gate.status === 'pass')).toBe(true)
  })

  it('surfaces missing artifact failures with gate evidence', () => {
    const report = createScenarioReport('fixed', {
      ...demoHarnessArtifacts,
      rollbackNote: '',
      missingArtifacts: ['docs/rollback.md'],
    })

    const rollbackGate = report.gates.find((gate) => gate.id === 'rollback-ready')

    expect(rollbackGate?.status).toBe('fail')
    expect(rollbackGate?.observed).toBe('artifact missing')
    expect(report.summary.blocked).toBe(true)
  })

  it('surfaces data boundary failures from the real fixture contract', () => {
    const report = createScenarioReport('fixed', {
      ...demoHarnessArtifacts,
      dataBoundaryFixture: {
        ...demoHarnessArtifacts.dataBoundaryFixture,
        dataClass: 'production-log',
      },
    })

    expect(report.gates.find((gate) => gate.id === 'data-boundary')?.status).toBe('fail')
    expect(report.summary.blocked).toBe(true)
  })

  it('surfaces missing observability failures with gate evidence', () => {
    const report = createScenarioReport('fixed', {
      ...demoHarnessArtifacts,
      missingArtifacts: ['config/observability.json'],
    })

    const observabilityGate = report.gates.find((gate) => gate.id === 'observability-ready')

    expect(observabilityGate?.status).toBe('fail')
    expect(observabilityGate?.observed).toBe('artifact missing')
    expect(report.summary.blocked).toBe(true)
  })

  it('keeps the structured gate contract stable', () => {
    const report = createScenarioReport('fixed', demoHarnessArtifacts)
    const summary = summarizeGates(report.gates)

    expect(summary).toEqual(report.summary)
    expect(report.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          status: expect.stringMatching(/pass|fail/),
          source: expect.any(String),
          observed: expect.any(String),
          expected: expect.any(String),
          detail: expect.any(String),
        }),
      ]),
    )
  })

  it('returns No-Go when required checks fail and Go when they pass', () => {
    expect(createScenarioReport('buggy', demoHarnessArtifacts).pilotDecision.decision).toBe('No-Go')
    expect(createScenarioReport('fixed', demoHarnessArtifacts).pilotDecision.decision).toBe('Go')
    expect(decidePilot(createScenarioReport('fixed', demoHarnessArtifacts).pilotMetrics).decision).toBe('Go')
    expect(createScenarioReport('fixed', demoHarnessArtifacts).pilotMetrics.find((metric) => metric.id === 'review-p95')?.value).toContain('demo pilot fixture')
  })
})
