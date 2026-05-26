export type ScenarioMode = 'buggy' | 'fixed'

export interface CouponRedeemRequest {
  couponId: string
  memberId: string
  idempotencyKey: string
}

export interface CouponScenarioInput {
  request: CouponRedeemRequest
  initialBalance: number
  retryCount: number
}

export interface CouponSafetyTarget {
  balanceDelta: number
  duplicateChargeDetected: boolean
  reusedResult: boolean
}

export interface RedemptionRecord {
  id: string
  attempt: number
  couponId: string
  memberId: string
  idempotencyKey: string
  balanceAfter: number
}

export interface RedeemResponse {
  attempt: number
  balanceAfter: number
  recordId: string
  reusedResult: boolean
}

export interface CouponScenarioResult extends CouponSafetyTarget {
  mode: ScenarioMode
  request: CouponRedeemRequest
  retryAttempts: number
  balanceBefore: number
  balanceAfter: number
  redemptionRecords: RedemptionRecord[]
  responses: RedeemResponse[]
}

export const defaultCouponScenarioInput: CouponScenarioInput = {
  initialBalance: 2,
  retryCount: 2,
  request: {
    couponId: 'SPRING-20',
    memberId: 'demo-user-42',
    idempotencyKey: 'order-8842-retry-1',
  },
}

export function runCouponScenario(
  mode: ScenarioMode,
  input: CouponScenarioInput = defaultCouponScenarioInput,
): CouponScenarioResult {
  let balance = input.initialBalance
  const redemptionRecords: RedemptionRecord[] = []
  const responses: RedeemResponse[] = []
  const responseByIdempotencyKey = new Map<string, RedeemResponse>()

  for (let attempt = 1; attempt <= input.retryCount; attempt += 1) {
    const cachedResponse = responseByIdempotencyKey.get(input.request.idempotencyKey)

    if (mode === 'fixed' && cachedResponse) {
      responses.push({
        ...cachedResponse,
        attempt,
        reusedResult: true,
      })
      continue
    }

    balance -= 1

    const redemptionRecord: RedemptionRecord = {
      id: `redemption-${attempt}`,
      attempt,
      couponId: input.request.couponId,
      memberId: input.request.memberId,
      idempotencyKey: input.request.idempotencyKey,
      balanceAfter: balance,
    }

    redemptionRecords.push(redemptionRecord)

    const response: RedeemResponse = {
      attempt,
      balanceAfter: balance,
      recordId: redemptionRecord.id,
      reusedResult: false,
    }

    responses.push(response)

    if (mode === 'fixed') {
      responseByIdempotencyKey.set(`${input.request.idempotencyKey}:${attempt}`, response)
    }
  }

  const balanceDelta = balance - input.initialBalance
  const reusedResult = responses.some((response) => response.reusedResult)
  const duplicateChargeDetected = redemptionRecords.length > 1 || balanceDelta < -1

  return {
    mode,
    request: input.request,
    retryAttempts: input.retryCount,
    balanceBefore: input.initialBalance,
    balanceAfter: balance,
    balanceDelta,
    redemptionRecords,
    responses,
    reusedResult,
    duplicateChargeDetected,
  }
}