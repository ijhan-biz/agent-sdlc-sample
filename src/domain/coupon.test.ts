import { describe, expect, it } from 'vitest'
import { runCouponScenario } from './coupon'

describe('coupon scenario runner', () => {
  it('reproduces the duplicate charge in buggy mode', () => {
    const result = runCouponScenario('buggy')

    expect(result.balanceDelta).toBe(-2)
    expect(result.duplicateChargeDetected).toBe(true)
    expect(result.reusedResult).toBe(false)
    expect(result.redemptionRecords).toHaveLength(2)
  })

  it('reuses the first result in fixed mode', () => {
    const result = runCouponScenario('fixed')

    expect(result.balanceDelta).toBe(-1)
    expect(result.duplicateChargeDetected).toBe(false)
    expect(result.reusedResult).toBe(true)
    expect(result.redemptionRecords).toHaveLength(1)
  })
})