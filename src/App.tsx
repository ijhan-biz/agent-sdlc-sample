import { useMemo, useState, type ReactNode } from 'react'
import './App.css'
import {
  acceptanceCriteria,
  couponBug,
  evidenceByStage,
  pullRequest,
  stages,
  type StageId,
} from './data/scenario'
import { demoHarnessArtifacts } from './data/harnessArtifacts'
import { getStageIndex, nextStage, previousStage } from './lib/demoRunner'
import { createScenarioReport, type CouponScenarioReport } from './lib/gateEvaluator'

function App() {
  const [activeStage, setActiveStage] = useState<StageId>('bug')
  const [patchApplied, setPatchApplied] = useState(false)

  const activeIndex = getStageIndex(activeStage)
  const scenarioMode = patchApplied ? 'fixed' : 'buggy'
  const scenarioReport = useMemo(() => createScenarioReport(scenarioMode, demoHarnessArtifacts), [scenarioMode])
  const gateSummary = scenarioReport.summary
  const pilotDecision = scenarioReport.pilotDecision
  const currentStage = stages[activeIndex]
  const evidence = evidenceByStage[activeStage]
  const testStatus = scenarioReport.couponResult.duplicateChargeDetected ? 'retry test failing' : 'retry tests pass'
  const harnessStatus = gateSummary.blocked ? 'blocked' : 'pass'
  const liveStatusItems: LiveStatusItem[] = [
    {
      label: '테스트 상태',
      value: testStatus,
      detail: scenarioReport.couponResult.duplicateChargeDetected
        ? `balance delta ${scenarioReport.couponResult.balanceDelta}`
        : 'idempotencyKey 결과 재사용',
      tone: scenarioReport.couponResult.duplicateChargeDetected ? 'red' : 'green',
      stageId: 'tests',
      actionLabel: 'Failed Tests 보기',
    },
    {
      label: '하네스',
      value: harnessStatus,
      detail: gateSummary.blocked ? `${gateSummary.failed}개 gate가 merge 차단` : 'required checks 통과',
      tone: gateSummary.blocked ? 'red' : 'green',
      stageId: 'harness',
      actionLabel: 'Harness Gate 보기',
    },
    {
      label: '파일럿',
      value: pilotDecision.decision,
      detail: pilotDecision.decision === 'Go' ? '파일럿 확산 가능' : pilotDecision.reasons.join(', '),
      tone: pilotDecision.decision === 'Go' ? 'green' : 'red',
      stageId: 'pilot',
      actionLabel: 'Pilot 판단 보기',
    },
  ]

  const reset = () => {
    setActiveStage('bug')
    setPatchApplied(false)
  }

  const getStageBadge = (stageId: StageId) => {
    if (stageId === 'tests') {
      return patchApplied ? 'PASS' : 'FAIL'
    }

    if (stageId === 'harness') {
      return gateSummary.blocked ? 'BLOCKED' : 'PASS'
    }

    if (stageId === 'pilot') {
      return pilotDecision.decision.toUpperCase()
    }

    return null
  }

  return (
    <main className="app-shell">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Agentic SDLC Demo - Coupon API storyline</p>
          <h1>쿠폰 API 버그로 보는 Agentic SDLC</h1>
          <p className="hero-copy">
            모호한 이슈를 AC로 바꾸고, 작은 PR을 만들고, 실패 테스트와 하네스 게이트를 거쳐
            파일럿 Go/No-Go까지 이어지는 발표용 데모입니다.
          </p>
          <p className="demo-url">강의 슬라이드 연결: Slides 4-23 · 실행 URL: http://127.0.0.1:5173/</p>
        </div>
        <div className="hero-actions" aria-label="데모 컨트롤">
          <button type="button" onClick={() => setActiveStage(previousStage(activeStage))} disabled={activeIndex === 0}>
            이전
          </button>
          <button type="button" onClick={() => setActiveStage(nextStage(activeStage))} disabled={activeIndex === stages.length - 1}>
            다음 단계
          </button>
          <button type="button" className="danger" onClick={() => setActiveStage('tests')}>
            Failed Tests 보기
          </button>
          <button type="button" className="secondary" onClick={() => setPatchApplied(true)}>
            최소 패치 적용
          </button>
          <button type="button" className="ghost" onClick={reset}>
            리셋
          </button>
        </div>
      </header>

      <section className="status-strip" aria-label="데모 상태 요약">
        <StatusPill label="현재 단계" value={`${activeIndex + 1}. ${currentStage.title}`} tone="blue" />
        <StatusPill label="테스트 상태" value={testStatus} tone={patchApplied ? 'green' : 'red'} />
        <StatusPill label="하네스" value={harnessStatus} tone={gateSummary.blocked ? 'red' : 'green'} />
        <StatusPill label="파일럿" value={pilotDecision.decision} tone={pilotDecision.decision === 'Go' ? 'green' : 'red'} />
      </section>

      <section className="live-status-panel" aria-label="실제 현황">
        <div className="live-status-heading">
          <span className="eyebrow">Live status</span>
          <h2>실제 현황</h2>
        </div>
        <div className="live-status-grid">
          {liveStatusItems.map((item) => (
            <article className={`live-status-card ${item.tone}`} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
              <button type="button" className="mini-button" onClick={() => setActiveStage(item.stageId)}>
                {item.actionLabel}
              </button>
            </article>
          ))}
        </div>
      </section>

      <div className="demo-layout">
        <aside className="timeline-panel" aria-label="Agentic SDLC 단계">
          <h2>데모 타임라인</h2>
          <ol className="timeline-list">
            {stages.map((stage, index) => (
              <li key={stage.id}>
                <button
                  type="button"
                  className={stage.id === activeStage ? 'active' : ''}
                  onClick={() => setActiveStage(stage.id)}
                >
                  <span className="step-number">{index + 1}</span>
                  <span>
                    <strong>{stage.title}</strong>
                    {getStageBadge(stage.id) ? <b className={`stage-badge ${getStageBadge(stage.id)?.toLowerCase().replace(/[^a-z]+/g, '-')}`}>{getStageBadge(stage.id)}</b> : null}
                    <em>{stage.slideRange}</em>
                    <small>{stage.summary}</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <section className="workbench-panel" aria-live="polite">
          <div className="panel-heading">
            <p className="eyebrow">{currentStage.mode}</p>
            <h2>{currentStage.title}</h2>
            <p>{currentStage.summary}</p>
          </div>
          <div className="lecture-bridge" aria-label="강의와 데모 연결">
            <span>{currentStage.slideRange}</span>
            <strong>{currentStage.lectureBridge}</strong>
            <p>{currentStage.demoAction}</p>
          </div>
          {renderStage(activeStage, scenarioReport)}
        </section>

        <aside className="evidence-panel" aria-label="현재 단계 증거">
          <h2>Evidence</h2>
          {evidence.map((item) => (
            <article className="evidence-card" key={item.id}>
              <span>{item.id}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </aside>
      </div>
    </main>
  )
}

function renderStage(
  activeStage: StageId,
  scenarioReport: CouponScenarioReport,
) {
  if (activeStage === 'bug') {
    return (
      <div className="stage-grid two">
        <InfoCard title="Bug report" tone="red">
          <p>{couponBug.report}</p>
          <dl>
            <dt>Endpoint</dt>
            <dd>{couponBug.endpoint}</dd>
            <dt>Signal</dt>
            <dd>{couponBug.signal}</dd>
          </dl>
        </InfoCard>
        <CodeBlock title="Reproduction request" code={formatRequestBlock(scenarioReport)} />
      </div>
    )
  }

  if (activeStage === 'ac') {
    return (
      <div className="checklist-grid">
        {acceptanceCriteria.map((item) => (
          <InfoCard key={item.id} title={item.title} tone="blue">
            <p>{item.description}</p>
            <span className="linked-test">Test: {item.testId}</span>
          </InfoCard>
        ))}
      </div>
    )
  }

  if (activeStage === 'pr') {
    return (
      <div className="stage-grid two">
        <InfoCard title={pullRequest.title} tone="purple">
          <p>{pullRequest.summary}</p>
          <ul>
            {pullRequest.files.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </InfoCard>
        <CodeBlock title="PR description" code={pullRequest.body} />
      </div>
    )
  }

  if (activeStage === 'tests') {
    const patchApplied = scenarioReport.mode === 'fixed'
    return (
      <div className="stage-grid two">
        <InfoCard title={`Runner result: ${patchApplied ? 'retry test is passing' : 'retry test is failing'}`} tone={patchApplied ? 'green' : 'red'}>
          <p>
            {patchApplied
              ? '최소 패치 후 동일 idempotencyKey 요청은 첫 결과를 재사용합니다.'
              : '실제 in-memory runner에서 retry 요청이 두 번 차감되는 상태를 재현했습니다.'}
          </p>
          <p className="callout">{patchApplied ? '패치 후 retry case가 통과합니다.' : '이 실패가 발표의 핵심 장면입니다.'}</p>
        </InfoCard>
        <CodeBlock title="Runner output" code={formatRunnerOutput(scenarioReport)} />
      </div>
    )
  }

  if (activeStage === 'harness') {
    return (
      <div className="gate-grid">
        {scenarioReport.gates.map((gate) => (
          <InfoCard key={gate.id} title={gate.label} tone={gate.status === 'pass' ? 'green' : 'red'}>
            <p>{gate.detail}</p>
            <dl className="gate-meta">
              <dt>Observed</dt>
              <dd>{gate.observed}</dd>
              <dt>Expected</dt>
              <dd>{gate.expected}</dd>
              <dt>Source</dt>
              <dd>{gate.source}</dd>
            </dl>
            <span className="linked-test">{gate.status.toUpperCase()}</span>
          </InfoCard>
        ))}
      </div>
    )
  }

  return (
    <div className="stage-grid two">
      <InfoCard title={`Pilot decision: ${scenarioReport.pilotDecision.decision}`} tone="yellow">
        <p>전사 롤아웃 전에 1개 팀, 1개 repo, 2주 파일럿으로 판단합니다.</p>
        <ul>
          {scenarioReport.pilotMetrics.map((metric) => (
            <li key={metric.id}>{metric.label}: {metric.value}</li>
          ))}
        </ul>
      </InfoCard>
      <CodeBlock
        title="Decision memo"
        code={formatDecisionMemo(scenarioReport)}
      />
    </div>
  )
}

function formatRequestBlock(report: CouponScenarioReport) {
  return `POST /api/coupons/redeem
${JSON.stringify(report.request, null, 2)}`
}

function formatRunnerOutput(report: CouponScenarioReport) {
  const result = report.couponResult

  if (result.duplicateChargeDetected) {
    return `FAIL coupon.retry.idempotent
Expected coupon balance to decrement once
Received balance delta: ${result.balanceDelta}

Assertion:
expect(redemptions).toHaveLength(1)
received ${result.redemptionRecords.length} redemption records

Harness: ${report.summary.blocked ? 'blocked' : 'pass'}
Pilot: ${report.pilotDecision.decision}`
  }

  return `PASS coupon.retry.idempotent
PASS coupon.already-used.reject
PASS contract.response-shape.stable

Balance delta: ${result.balanceDelta}
Redemption records: ${result.redemptionRecords.length}
Reused first result: ${result.reusedResult}

Harness: ${report.summary.blocked ? 'blocked' : 'pass'}
Pilot: ${report.pilotDecision.decision}`
}

function formatDecisionMemo(report: CouponScenarioReport) {
  return `Decision: ${report.pilotDecision.decision}
Mode: ${report.mode}
Scope: coupon-api sample repo
Harness: ${report.summary.blocked ? 'blocked' : 'pass'} (${report.summary.failed}/${report.summary.total} failing gates)
Go condition: no sensitive data, 100% required checks, review p95 <= 1 day
Next: repeat Agent Mode -> Coding Agent -> Harness loop for 2 weeks`
}

interface LiveStatusItem {
  label: string
  value: string
  detail: string
  tone: 'green' | 'red'
  stageId: StageId
  actionLabel: string
}

function StatusPill({ label, value, tone }: { label: string; value: string; tone: 'blue' | 'green' | 'yellow' | 'red' }) {
  return (
    <div className={`status-pill ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function InfoCard({ title, tone, children }: { title: string; tone: 'blue' | 'green' | 'yellow' | 'red' | 'purple'; children: ReactNode }) {
  return (
    <article className={`info-card ${tone}`}>
      <h3>{title}</h3>
      {children}
    </article>
  )
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <article className="code-card">
      <h3>{title}</h3>
      <pre>{code}</pre>
    </article>
  )
}

export default App
