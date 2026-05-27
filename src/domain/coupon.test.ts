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

  it('does not double-decrement balance when same idempotencyKey is retried multiple times', () => {
    const result = runCouponScenario('fixed', {
      initialBalance: 5,
      retryCount: 3,
      request: {
        couponId: 'SPRING-20',
        memberId: 'demo-user-42',
        idempotencyKey: 'order-retry-test-001',
      },
    })

    expect(result.balanceDelta).toBe(-1)
    expect(result.duplicateChargeDetected).toBe(false)
    expect(result.redemptionRecords).toHaveLength(1)
    expect(result.responses).toHaveLength(3)
    expect(result.responses[1].reusedResult).toBe(true)
    expect(result.responses[2].reusedResult).toBe(true)
  })

  it('returns the original balanceAfter when idempotencyKey is reused on a second attempt', () => {
    const result = runCouponScenario('fixed', {
      initialBalance: 10,
      retryCount: 2,
      request: {
        couponId: 'SPRING-20',
        memberId: 'demo-user-99',
        idempotencyKey: 'order-already-used-001',
      },
    })

    expect(result.responses[0].reusedResult).toBe(false)
    expect(result.responses[1].reusedResult).toBe(true)
    expect(result.responses[0].balanceAfter).toBe(result.responses[1].balanceAfter)
    expect(result.balanceDelta).toBe(-1)
  })
})