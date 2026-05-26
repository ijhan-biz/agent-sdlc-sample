import type { GateResult } from '../lib/gateEvaluator'

export type StageId = 'bug' | 'ac' | 'github' | 'pr' | 'tests' | 'harness' | 'pilot'

export type GitHubPipelineStepId = 'issue' | 'agent-plan' | 'copilot-assign' | 'generated-pr' | 'checks' | 'merge-gate'

export interface DemoStage {
  id: StageId
  title: string
  mode: string
  summary: string
  slideRange: string
  lectureBridge: string
  demoAction: string
}

export interface EvidenceItem {
  id: string
  title: string
  detail: string
}

export interface GitHubPipelineStep {
  id: GitHubPipelineStepId
  title: string
  surface: string
  actor: string
  command: string
  detail: string
  artifact: string
  gate: string
  url: string
}

export interface GitHubLiveArtifact {
  id: string
  title: string
  status: string
  url: string
  detail: string
  evidence: string
}

export const stages: DemoStage[] = [
  {
    id: 'bug',
    title: 'Coupon API Bug',
    mode: 'Issue intake',
    summary: '모바일 재시도 상황에서 같은 쿠폰이 두 번 차감되는 모호한 버그를 접수한다.',
    slideRange: 'Slides 4-8',
    lectureBridge: '강의에서는 “바로 고쳐줘” 전에 문제를 작업 계약으로 바꿔야 한다고 설명한다.',
    demoAction: '왼쪽 1번 Coupon API Bug를 열고 endpoint, signal, reproduction request를 보여준다.',
  },
  {
    id: 'ac',
    title: 'Acceptance Criteria',
    mode: 'Agent Mode',
    summary: 'AI에게 바로 고치라고 하지 않고 재현 조건, AC, 테스트 후보를 먼저 만든다.',
    slideRange: 'Slide 9',
    lectureBridge: 'Agent Mode의 첫 가치는 코드 생성이 아니라 질문 생성과 AC 정리다.',
    demoAction: '2번 Acceptance Criteria를 클릭하고 AC와 연결된 test id를 읽어준다.',
  },
  {
    id: 'github',
    title: 'GitHub Codegen Pipeline',
    mode: 'GitHub integration',
    summary: 'Issue, 라벨, Copilot 할당, PR, Checks, merge gate가 이어지는 코드 자동생성 파이프라인을 보여준다.',
    slideRange: 'Slides 10-13',
    lectureBridge: '세미나 자료의 핵심 흐름은 Agent Mode로 계약을 만들고 GitHub에서 Copilot에 작은 PR을 맡기는 것이다.',
    demoAction: '3번 GitHub Codegen Pipeline을 열고 Issue에서 PR Checks까지 이어지는 연결선을 먼저 보여준다.',
  },
  {
    id: 'pr',
    title: 'Coding Agent PR',
    mode: 'Async PR',
    summary: 'idempotencyKey 처리만 좁게 잘라 Coding Agent에 위임한다.',
    slideRange: 'Slide 13',
    lectureBridge: 'Cloud Agent에는 큰 문제 전체가 아니라 좁고 검증 가능한 PR 계약만 맡긴다.',
    demoAction: '4번 Coding Agent PR을 클릭하고 changed files와 PR description을 보여준다.',
  },
  {
    id: 'tests',
    title: 'Failed Tests',
    mode: 'Verify',
    summary: 'retry 테스트가 실패하고 required checks가 머지를 차단하는 장면을 보여준다.',
    slideRange: 'Slides 14-15',
    lectureBridge: '가장 중요한 장면은 AI PR이 실패하고 required checks가 머지를 막는 순간이다.',
    demoAction: '5번 Failed Tests를 클릭하고 FAIL 로그를 보여준 뒤, 아직 최소 패치 적용 버튼은 누르지 않는다.',
  },
  {
    id: 'harness',
    title: 'Harness Gate',
    mode: 'Harness Engineering',
    summary: '테스트, 라벨, CODEOWNERS, secret scan, rollback 조건을 게이트로 묶는다.',
    slideRange: 'Slides 16-18',
    lectureBridge: 'Harness는 테스트, 정책, 데이터 경계, 리뷰, 롤백을 하나의 실행 환경으로 묶는다.',
    demoAction: '최소 패치 적용 버튼을 누른 뒤 6번 Harness Gate에서 FAIL이 PASS로 바뀌는 것을 보여준다.',
  },
  {
    id: 'pilot',
    title: 'Pilot Go/No-Go',
    mode: 'Operating model',
    summary: '전사 도입 대신 1개 팀, 1개 repo, 2주 파일럿의 판단 기준으로 닫는다.',
    slideRange: 'Slides 19-21',
    lectureBridge: '도입 판단은 기능표가 아니라 데이터 경계, required checks, 리뷰 p95 같은 운영 기준으로 닫는다.',
    demoAction: '7번 Pilot Go/No-Go를 클릭하고 패치 전 No-Go, 패치 후 Go 판단이 어떻게 바뀌는지 연결한다.',
  },
]

export const githubAutomation = {
  repository: 'github.com/ijhan-biz/agent-sdlc-sample',
  repositoryUrl: 'https://github.com/ijhan-biz/agent-sdlc-sample',
  issueNumber: 1,
  issueTitle: 'Demo: coupon double redemption on retry',
  issueUrl: 'https://github.com/ijhan-biz/agent-sdlc-sample/issues/1',
  issueCommentUrl: 'https://github.com/ijhan-biz/agent-sdlc-sample/issues/1#issuecomment-4544785558',
  issueState: 'OPEN',
  labels: ['bug', 'ai-candidate', 'ai-ready'],
  assignee: 'Copilot',
  branch: 'demo/failing-copilot-pr-issue-1',
  pullRequestNumber: 2,
  pullRequestTitle: 'Demo: failing Copilot coupon idempotency PR',
  pullRequestUrl: 'https://github.com/ijhan-biz/agent-sdlc-sample/pull/2',
  pullRequestState: 'OPEN',
  pullRequestMergeState: 'UNSTABLE',
  pullRequestLabels: ['ai-assisted'],
  workflow: 'Agentic SDLC CI',
  actionsRunId: 26452802428,
  actionsRunUrl: 'https://github.com/ijhan-biz/agent-sdlc-sample/actions/runs/26452802428',
  checkRunName: 'Required checks',
  checkRunStatus: 'COMPLETED',
  checkRunConclusion: 'FAILURE',
  checkRunUrl: 'https://github.com/ijhan-biz/agent-sdlc-sample/actions/runs/26452802428/job/77878116194',
  failedStep: 'Test',
  failureSummary: 'src/domain/coupon.test.ts receives balanceDelta=-2 instead of -1',
  artifacts: [
    '.github/ISSUE_TEMPLATE/copilot-codegen-task.yml',
    '.github/pull_request_template.md',
    '.github/workflows/ci.yml',
    '.github/CODEOWNERS',
  ],
}

export const githubLiveArtifacts: GitHubLiveArtifact[] = [
  {
    id: 'github-issue-1',
    title: 'Issue #1',
    status: 'OPEN',
    url: githubAutomation.issueUrl,
    detail: githubAutomation.issueTitle,
    evidence: 'labels: bug, ai-candidate, ai-ready',
  },
  {
    id: 'github-pr-2',
    title: 'PR #2',
    status: 'OPEN / UNSTABLE',
    url: githubAutomation.pullRequestUrl,
    detail: githubAutomation.pullRequestTitle,
    evidence: `head: ${githubAutomation.branch}; label: ai-assisted`,
  },
  {
    id: 'github-run-26452802428',
    title: 'Actions run',
    status: 'FAILURE',
    url: githubAutomation.actionsRunUrl,
    detail: `${githubAutomation.workflow} #${githubAutomation.actionsRunId}`,
    evidence: `${githubAutomation.checkRunName} failed at ${githubAutomation.failedStep}`,
  },
  {
    id: 'github-check-log',
    title: 'Failed check log',
    status: 'FAILURE',
    url: githubAutomation.checkRunUrl,
    detail: githubAutomation.failureSummary,
    evidence: 'expected -2 to be -1; required checks block merge',
  },
]

export const githubPipeline: GitHubPipelineStep[] = [
  {
    id: 'issue',
    title: 'Issue contract',
    surface: 'GitHub Issues',
    actor: 'Developer + Agent Mode',
    command: 'gh issue create --label bug,ai-candidate',
    detail: '모호한 중복 차감 리포트를 endpoint, AC, test id, 데이터 경계가 있는 작업 계약으로 바꾼다.',
    artifact: '.github/ISSUE_TEMPLATE/copilot-codegen-task.yml',
    gate: 'ai-candidate label',
    url: githubAutomation.issueUrl,
  },
  {
    id: 'agent-plan',
    title: 'AC comment',
    surface: 'Issue comment',
    actor: 'VS Code Copilot Agent',
    command: 'gh issue comment 1 --body-file ac.md',
    detail: '코드 수정 전에 재현 질문, Acceptance Criteria, 영향 파일, 테스트 후보를 이슈에 남긴다.',
    artifact: 'src/data/scenario.ts',
    gate: 'ai-plan label',
    url: githubAutomation.issueCommentUrl,
  },
  {
    id: 'copilot-assign',
    title: 'Assign to Copilot',
    surface: 'Issue assignees',
    actor: 'GitHub Copilot coding agent',
    command: 'GitHub UI: Issues -> Assignees -> Copilot',
    detail: 'AC가 명확해진 뒤 idempotencyKey 처리만 작은 비동기 코드 생성 작업으로 위임한다.',
    artifact: '.github/ISSUE_TEMPLATE/copilot-codegen-task.yml',
    gate: 'ai-ready label',
    url: githubAutomation.issueUrl,
  },
  {
    id: 'generated-pr',
    title: 'Generated PR',
    surface: 'Pull requests',
    actor: 'Copilot coding agent',
    command: 'gh pr view 2 --web',
    detail: '데모 PR이 생성되고 사람 리뷰 큐로 들어가지만, 의도적으로 실패한 테스트 때문에 merge가 막힌다.',
    artifact: '.github/pull_request_template.md',
    gate: 'ai-assisted label',
    url: githubAutomation.pullRequestUrl,
  },
  {
    id: 'checks',
    title: 'Required checks',
    surface: 'GitHub Actions',
    actor: 'CI harness',
    command: 'gh pr checks 2',
    detail: '실제 Actions run에서 Test step이 실패했고, Required checks가 FAILURE로 완료됐다.',
    artifact: '.github/workflows/ci.yml',
    gate: 'required status checks',
    url: githubAutomation.actionsRunUrl,
  },
  {
    id: 'merge-gate',
    title: 'Review gate',
    surface: 'Rulesets + CODEOWNERS',
    actor: 'Owner reviewer',
    command: 'gh run view 26452802428 --log-failed',
    detail: 'PR은 OPEN / UNSTABLE 상태로 남아 데모에서 merge blocked 화면과 실패 로그를 보여준다.',
    artifact: '.github/CODEOWNERS',
    gate: 'owner approval',
    url: githubAutomation.checkRunUrl,
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
  title: githubAutomation.pullRequestTitle,
  summary: 'GitHub에 실제로 열린 PR #2는 idempotency cache key를 잘못 바꾼 데모 변경으로, Required checks 실패와 merge block을 보여준다.',
  files: ['src/domain/coupon.ts', 'src/domain/coupon.test.ts', 'src/lib/gateEvaluator.test.ts'],
  body: `## AI-assisted change
- [x] Related issue: #${githubAutomation.issueNumber}
- [x] Label: ai-assisted
- [x] Required checks attached
- [x] Failure is intentional for seminar demo

Expected failure:
- ${githubAutomation.failureSummary}
- ${githubAutomation.checkRunName}: ${githubAutomation.checkRunConclusion}

Do not merge this PR. Use it to show failed checks and harness gate behavior.`,
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
  github: [
    { id: 'GH-ISSUE-1', title: 'Live Issue #1', detail: 'GitHub Issue에 AC, labels, test id, 데이터 경계를 남겼다.' },
    { id: 'GH-PR-2', title: 'Live PR #2', detail: '실패하는 데모 PR이 OPEN / UNSTABLE 상태로 올라가 있다.' },
    { id: 'GH-ACTIONS', title: 'Failed Actions run', detail: 'Required checks가 FAILURE로 완료되어 merge를 막는다.' },
  ],
  pr: [
    { id: 'PR-2', title: 'Failing GitHub PR', detail: '실제 GitHub PR #2가 실패 체크와 함께 열려 있다.' },
    { id: 'CHECK-RUN', title: 'Required checks', detail: 'Actions run 26452802428의 Test step이 실패했다.' },
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

export const sampleFailingGates: GateResult[] = [
  {
    id: 'coupon-idempotency',
    label: 'Affected unit tests',
    status: 'fail',
    source: 'runner',
    observed: 'balanceDelta=-2; duplicateChargeDetected=true; reusedResult=false',
    expected: 'balanceDelta=-1; duplicateChargeDetected=false; reusedResult=true',
    detail: 'coupon.retry.idempotent failed',
  },
  {
    id: 'owner-coverage',
    label: 'Owner coverage',
    status: 'pass',
    source: 'config/owners.json',
    observed: 'coupon-service-owner',
    expected: 'coupon-redeem owner with reviewRequired=true',
    detail: 'owner review is mapped',
  },
  {
    id: 'forbidden-patterns',
    label: 'Forbidden patterns',
    status: 'pass',
    source: 'config/harness.json forbiddenPatterns',
    observed: '0 hits',
    expected: '0 hits in demo artifacts',
    detail: 'no secret or customer data found',
  },
]
