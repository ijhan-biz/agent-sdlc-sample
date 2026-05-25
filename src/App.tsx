import { useMemo, useState, type ReactNode } from 'react'
import './App.css'
import {
  acceptanceCriteria,
  blockedPilotMetrics,
  couponBug,
  evidenceByStage,
  pilotMetrics,
  pullRequest,
  stages,
  testResults,
  type StageId,
} from './data/scenario'
import { getStageIndex, nextStage, previousStage } from './lib/demoRunner'
import { decidePilot, evaluateHarness, summarizeGates } from './lib/gateEvaluator'

function App() {
  const [activeStage, setActiveStage] = useState<StageId>('bug')
  const [patchApplied, setPatchApplied] = useState(false)

  const activeIndex = getStageIndex(activeStage)
  const gates = useMemo(() => evaluateHarness(patchApplied), [patchApplied])
  const gateSummary = summarizeGates(gates)
  const currentPilotMetrics = patchApplied ? pilotMetrics : blockedPilotMetrics
  const pilotDecision = decidePilot(currentPilotMetrics)
  const currentStage = stages[activeIndex]
  const evidence = evidenceByStage[activeStage]

  const reset = () => {
    setActiveStage('bug')
    setPatchApplied(false)
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
        <StatusPill label="테스트 상태" value={patchApplied ? 'retry tests pass' : 'retry test failing'} tone={patchApplied ? 'green' : 'red'} />
        <StatusPill label="하네스" value={gateSummary.blocked ? 'blocked' : 'pass'} tone={gateSummary.blocked ? 'red' : 'green'} />
        <StatusPill label="파일럿" value={pilotDecision.decision} tone="yellow" />
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
          {renderStage(activeStage, patchApplied, gates, currentPilotMetrics, pilotDecision.decision)}
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
  patchApplied: boolean,
  gates: ReturnType<typeof evaluateHarness>,
  currentPilotMetrics: typeof pilotMetrics,
  pilotDecision: string,
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
        <CodeBlock title="Reproduction request" code={couponBug.request} />
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
    const result = patchApplied ? testResults.fixed : testResults.failing
    return (
      <div className="stage-grid two">
        <InfoCard title={result.title} tone={patchApplied ? 'green' : 'red'}>
          <p>{result.summary}</p>
          <p className="callout">{patchApplied ? '패치 후 retry case가 통과합니다.' : '이 실패가 발표의 핵심 장면입니다.'}</p>
        </InfoCard>
        <CodeBlock title="Vitest output" code={result.log} />
      </div>
    )
  }

  if (activeStage === 'harness') {
    return (
      <div className="gate-grid">
        {gates.map((gate) => (
          <InfoCard key={gate.id} title={gate.label} tone={gate.status === 'pass' ? 'green' : 'red'}>
            <p>{gate.detail}</p>
            <span className="linked-test">{gate.status.toUpperCase()}</span>
          </InfoCard>
        ))}
      </div>
    )
  }

  return (
    <div className="stage-grid two">
      <InfoCard title={`Pilot decision: ${pilotDecision}`} tone="yellow">
        <p>전사 롤아웃 전에 1개 팀, 1개 repo, 2주 파일럿으로 판단합니다.</p>
        <ul>
          {currentPilotMetrics.map((metric) => (
            <li key={metric.id}>{metric.label}: {metric.value}</li>
          ))}
        </ul>
      </InfoCard>
      <CodeBlock
        title="Decision memo"
        code={`Decision: ${pilotDecision}\nScope: coupon-api sample repo\nGo condition: no sensitive data, 100% required checks, review p95 <= 1 day\nNext: repeat Agent Mode -> Coding Agent -> Harness loop for 2 weeks`}
      />
    </div>
  )
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
