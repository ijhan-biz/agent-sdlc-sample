import type { GateResult, PilotMetric } from '../lib/gateEvaluator'

export type StageId = 'bug' | 'ac' | 'pr' | 'tests' | 'harness' | 'pilot'

export interface DemoStage {
  id: StageId
  title: string
  mode: string
  summary: string
}

export interface EvidenceItem {
  id: string
  title: string
  detail: string
}

export const stages: DemoStage[] = [
  {
    id: 'bug',
    title: 'Coupon API Bug',
    mode: 'Issue intake',
    summary: '모바일 재시도 상황에서 같은 쿠폰이 두 번 차감되는 모호한 버그를 접수한다.',
  },
  {
    id: 'ac',
    title: 'Acceptance Criteria',
    mode: 'Agent Mode',
    summary: 'AI에게 바로 고치라고 하지 않고 재현 조건, AC, 테스트 후보를 먼저 만든다.',
  },
  {
    id: 'pr',
    title: 'Coding Agent PR',
    mode: 'Async PR',
    summary: 'idempotencyKey 처리만 좁게 잘라 Coding Agent에 위임한다.',
  },
  {
    id: 'tests',
    title: 'Failed Tests',
    mode: 'Verify',
    summary: 'retry 테스트가 실패하고 required checks가 머지를 차단하는 장면을 보여준다.',
  },
  {
    id: 'harness',
    title: 'Harness Gate',
    mode: 'Harness Engineering',
    summary: '테스트, 라벨, CODEOWNERS, secret scan, rollback 조건을 게이트로 묶는다.',
  },
  {
    id: 'pilot',
    title: 'Pilot Go/No-Go',
    mode: 'Operating model',
    summary: '전사 도입 대신 1개 팀, 1개 repo, 2주 파일럿의 판단 기준으로 닫는다.',
  },
]

export const couponBug = {
  report: '쿠폰이 가끔 두 번 차감된다는 고객 문의가 들어왔다. 로그는 많지만 재현 조건이 불명확하다.',
  endpoint: 'POST /api/coupons/redeem',
  signal: 'retry window 2s 안에서 동일 idempotencyKey 요청이 중복 처리됨',
  request: `POST /api/coupons/redeem
{
  "couponId": "SPRING-20",
  "memberId": "demo-user-42",
  "idempotencyKey": "order-8842-retry-1"
}`,
}

export const acceptanceCriteria = [
  {
    id: 'AC-1',
    title: '같은 idempotencyKey는 최초 결과를 반환한다',
    description: '동일 키로 재시도된 요청은 쿠폰 잔액을 다시 차감하지 않고 첫 처리 결과를 돌려준다.',
    testId: 'coupon.retry.idempotent',
  },
  {
    id: 'AC-2',
    title: '이미 사용된 쿠폰은 재차감하지 않는다',
    description: 'already-used 상태의 쿠폰은 명확한 오류와 함께 종료한다.',
    testId: 'coupon.already-used.reject',
  },
  {
    id: 'AC-3',
    title: '응답 스키마는 유지한다',
    description: '모바일 클라이언트 호환성을 위해 public response shape는 바꾸지 않는다.',
    testId: 'contract.response-shape.stable',
  },
  {
    id: 'AC-4',
    title: '운영 로그 원문은 사용하지 않는다',
    description: '재현 데이터는 더미 값만 사용하고 고객 데이터와 키를 프롬프트에 넣지 않는다.',
    testId: 'policy.no-prod-data',
  },
]

export const pullRequest = {
  title: 'fix(coupon): guard duplicate redemption by idempotency key',
  summary: '쿠폰 차감 전 idempotency store를 조회하고, retry 요청은 최초 처리 결과를 반환하도록 좁은 변경을 만든다.',
  files: ['src/coupon/redeem.ts', 'src/coupon/idempotency-store.ts', 'src/coupon/redeem.test.ts'],
  body: `## AI-assisted change
- [x] AC and tests linked
- [x] no prod logs / customer data / secrets used
- [x] rollback condition noted

Risk: retry path may still double-decrement if store lookup happens after balance update.
Required checks: unit, contract, secret scan, CODEOWNERS`,
}

export const testResults = {
  failing: {
    title: 'retry test is failing',
    summary: 'AI PR은 도착했지만 retry case에서 잔액이 두 번 감소한다.',
    log: `FAIL coupon.retry.idempotent
Expected coupon balance to decrement once
Received balance delta: -2

Assertion:
expect(redemptions).toHaveLength(1)
received 2 redemption records`,
  },
  fixed: {
    title: 'retry test is passing',
    summary: '최소 패치 후 동일 idempotencyKey 요청은 첫 결과를 반환한다.',
    log: `PASS coupon.retry.idempotent
PASS coupon.already-used.reject
PASS contract.response-shape.stable

All affected tests passed after minimal patch`,
  },
}

export const evidenceByStage: Record<StageId, EvidenceItem[]> = {
  bug: [
    { id: 'BUG-128', title: 'Bug report', detail: '재시도 중복 차감 제보. 고객 원문 로그는 사용하지 않음.' },
    { id: 'API-REDEEM', title: 'Affected endpoint', detail: 'POST /api/coupons/redeem' },
  ],
  ac: [
    { id: 'AC-LIST', title: 'Agent Mode output', detail: '재현 조건, AC, 테스트 후보, 영향 파일 후보.' },
    { id: 'DATA-RULE', title: 'Data boundary', detail: '더미 데이터만 사용. 운영 로그와 고객 정보 제외.' },
  ],
  pr: [
    { id: 'PR-42', title: 'Coding Agent PR', detail: '작은 계약으로 위임된 idempotency fix.' },
    { id: 'OWNER', title: 'CODEOWNERS', detail: 'coupon service owner review required.' },
  ],
  tests: [
    { id: 'VT-01', title: 'Vitest run', detail: 'retry idempotency case fails before patch.' },
    { id: 'CHECKS', title: 'Required checks', detail: '실패 테스트가 merge를 block한다.' },
  ],
  harness: [
    { id: 'GATE-UNIT', title: 'Unit gate', detail: 'affected tests must pass.' },
    { id: 'GATE-SEC', title: 'Secret scan', detail: 'prompt와 diff에 secret/customer data가 없어야 한다.' },
  ],
  pilot: [
    { id: 'PILOT-2W', title: 'Pilot scope', detail: '1개 팀, 1개 repo, 2주 반복.' },
    { id: 'SLO', title: 'Go/No-Go', detail: '보안, 리뷰 큐, required checks 기준으로 판단.' },
  ],
}

export const pilotMetrics: PilotMetric[] = [
  { id: 'sensitive-data', label: '금지 데이터 입력', value: '0건', status: 'pass' },
  { id: 'ai-label', label: 'AI PR 라벨링', value: '100%', status: 'pass' },
  { id: 'checks', label: 'Required checks', value: '100%', status: 'pass' },
  { id: 'review-p95', label: '리뷰 대기 p95', value: '0.8일', status: 'pass' },
]

export const blockedPilotMetrics: PilotMetric[] = [
  ...pilotMetrics.slice(0, 2),
  { id: 'checks', label: 'Required checks', value: 'retry test failing', status: 'fail' },
  pilotMetrics[3],
]

export const sampleFailingGates: GateResult[] = [
  { id: 'unit', label: 'Affected unit tests', status: 'fail', detail: 'coupon.retry.idempotent failed' },
  { id: 'label', label: 'AI PR label', status: 'pass', detail: 'ai-assisted label attached' },
  { id: 'secret', label: 'Secret scan', status: 'pass', detail: 'no secret or customer data found' },
]
