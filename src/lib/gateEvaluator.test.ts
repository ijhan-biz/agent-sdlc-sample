import { describe, expect, it } from 'vitest'
import { blockedPilotMetrics, pilotMetrics } from '../data/scenario'
import { decidePilot, evaluateHarness, summarizeGates } from './gateEvaluator'

describe('gate evaluator', () => {
  it('blocks the harness before the minimal patch is applied', () => {
    const summary = summarizeGates(evaluateHarness(false))

    expect(summary.blocked).toBe(true)
    expect(summary.failed).toBe(1)
  })

  it('passes the harness after the minimal patch is applied', () => {
    const summary = summarizeGates(evaluateHarness(true))

    expect(summary.blocked).toBe(false)
    expect(summary.failed).toBe(0)
  })

  it('returns No-Go when required checks fail', () => {
    expect(decidePilot(blockedPilotMetrics).decision).toBe('No-Go')
  })

  it('returns Go when all pilot metrics pass', () => {
    expect(decidePilot(pilotMetrics).decision).toBe('Go')
  })
})
