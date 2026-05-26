# Agentic SDLC Demo

Agentic SDLC 세미나에서 함께 실행하는 React 기반 발표용 데모입니다. 발표 스토리라인은 `쿠폰 API 버그 -> AC 생성 -> GitHub 코드 자동생성 파이프라인 -> Coding Agent PR -> 실패 테스트 -> Harness Gate -> Pilot Go/No-Go` 순서로 구성되어 있습니다.

이 데모는 실제 운영계를 건드리는 라이브 코딩이 아니라, 로컬 in-memory 쿠폰 도메인 runner와 artifact 기반 하네스를 함께 실행하는 발표용 데모입니다. 핵심은 GitHub Issue에서 Copilot coding agent로 작은 코드 생성 PR을 만들고, AI PR이 실패했을 때 테스트와 하네스가 안전하게 막고, 실패 로그를 다시 입력으로 바꿔 수정하는 장면입니다.

## 빠른 실행

발표 기준 URL은 `http://127.0.0.1:5173/`입니다.

```bash
cd /Users/hacbook/ms/workspace/agent-sdlc-sample
npm install
npm run demo -- --port 5173
```

브라우저에서 `http://127.0.0.1:5173/`을 열고 전체 화면으로 띄웁니다. 발표 중에는 왼쪽 타임라인 또는 상단 버튼으로 단계를 이동합니다.

GitHub에서 새로 받을 때는 아래처럼 시작합니다.

```bash
git clone https://github.com/ijhan-biz/agent-sdlc-sample.git
cd agent-sdlc-sample
npm install
npm run demo -- --port 5173
```

macOS에서는 서버를 띄운 뒤 별도 터미널에서 바로 열 수 있습니다.

```bash
open http://127.0.0.1:5173/
```

## 구체적인 실행 방법

처음 받은 저장소라면 의존성을 먼저 설치합니다.

```bash
cd /Users/hacbook/ms/workspace/agent-sdlc-sample
npm install
```

발표 전에 테스트, 빌드, fixed mode strict harness가 모두 통과하는지 확인합니다.

```bash
npm run validate
```

데모 서비스를 새로 시작합니다.

```bash
npm run demo -- --port 5173
```

이미 Vite 서버가 떠 있다면 실행 중인 터미널에서 `Ctrl+C`로 종료한 뒤 같은 명령을 다시 실행합니다. 5173 포트가 다른 프로세스에 잡혀 있으면 아래 명령으로 점유 상태를 확인한 다음, 비어 있는 포트를 골라 실행합니다.

```bash
lsof -nP -iTCP:5173 -sTCP:LISTEN
npm run demo -- --port 5174
```

서버가 정상 응답하는지 확인합니다.

```bash
curl -sSf http://127.0.0.1:5173/ | head -n 5
```

브라우저에서 데모를 엽니다.

```bash
open http://127.0.0.1:5173/
```

화면을 연 뒤 상단의 `리셋`을 눌러 `retry test failing`, `blocked`, `No-Go` 상태에서 시작합니다.

터미널로 실제 buggy/fixed 시나리오도 함께 보여줄 수 있습니다.

```bash
npm run demo:scenario -- --mode buggy
npm run demo:scenario -- --mode fixed
```

발표 중 화면이 흔들리면 JSON fallback으로 같은 하네스 결과를 확인합니다.

```bash
npm run --silent demo:scenario -- --mode buggy --json
```

서비스 재시작만 다시 해야 할 때는 아래 순서만 반복합니다.

```bash
# 실행 중인 Vite 터미널에서 Ctrl+C
npm run demo -- --port 5173
curl -sSf http://127.0.0.1:5173/ | head -n 5
```

## Coupon API Bug 보는 법

이 저장소의 `Coupon API Bug`는 실제 백엔드 API 서버가 아니라 로컬 in-memory 도메인 runner로 재현합니다. `/api/coupons/redeem` 엔드포인트를 실제로 서비스하는 서버는 없으므로 `curl -X POST http://127.0.0.1:5173/api/coupons/redeem`가 아니라 아래 CLI를 사용합니다.

```bash
npm run demo:scenario -- --mode buggy
npm run demo:scenario -- --mode fixed
npm run --silent demo:scenario -- --mode buggy --json
```

CLI와 React 화면은 같은 runner/evaluator 모델을 사용합니다. `buggy` 모드는 중복 차감을 재현하고 하네스를 `blocked`로 만들며, `fixed` 모드는 같은 `idempotencyKey`의 재시도 요청이 최초 결과를 재사용해 하네스를 통과합니다.

데모에서 보여주는 버그는 다음 상황입니다.

- 모바일 클라이언트가 2초 retry window 안에서 같은 요청을 다시 보냅니다.
- 요청은 같은 `couponId`, `memberId`, `idempotencyKey`를 사용합니다.
- 기대 동작은 같은 `idempotencyKey`의 재시도 요청이 최초 처리 결과를 그대로 반환하고 쿠폰을 다시 차감하지 않는 것입니다.
- 버그 상태에서는 재시도 요청이 중복 처리되어 쿠폰 잔액이 두 번 차감됩니다.

화면에서 보여줄 재현 요청은 아래 더미 데이터입니다.

```http
POST /api/coupons/redeem
{
  "couponId": "SPRING-20",
  "memberId": "demo-user-42",
  "idempotencyKey": "order-8842-retry-1"
}
```

버그를 보는 정확한 순서는 다음과 같습니다.

1. 서버를 실행합니다.

	```bash
	cd /Users/hacbook/ms/workspace/agent-sdlc-sample
	npm run demo -- --port 5173
	```

2. 브라우저에서 데모를 엽니다.

	```bash
	open http://127.0.0.1:5173/
	```

3. 상단의 `리셋`을 눌러 초기 상태로 맞춥니다.

4. 별도 터미널에서 실제 runner가 같은 상태를 출력하는지 확인합니다.

	```bash
	npm run demo:scenario -- --mode buggy
	```

5. 왼쪽 타임라인의 `1. Coupon API Bug`를 엽니다.
	- `Endpoint`: `POST /api/coupons/redeem`
	- `Signal`: `retry window 2s 안에서 동일 idempotencyKey 요청이 중복 처리됨`
	- `Reproduction request`: 위의 `SPRING-20`, `demo-user-42`, `order-8842-retry-1` 요청

6. 왼쪽 타임라인의 `4. Failed Tests`로 이동합니다.
	- 상단 상태 요약의 `테스트 상태`가 `retry test failing`인지 확인합니다.
	- `하네스`가 `blocked`인지 확인합니다.
	- `파일럿`이 `No-Go`인지 확인합니다.
	- 중앙의 `Runner output`에 아래 메시지가 보이는지 확인합니다.

	```text
	FAIL coupon.retry.idempotent
	Expected coupon balance to decrement once
	Received balance delta: -2

	Assertion:
	expect(redemptions).toHaveLength(1)
	received 2 redemption records
	```

이 장면이 발표에서 말하는 `Coupon API Bug`입니다. 핵심은 “AI가 만든 PR이 실패했다”가 아니라, retry 중복 차감이라는 위험이 테스트와 하네스에 의해 눈에 보이게 차단된다는 점입니다.

## 정확히 보여줄 커맨드와 변화

발표 중 터미널에서 실행할 커맨드는 네 종류만 사용하면 됩니다.

### 1. 데모 앱 실행

```bash
cd /Users/hacbook/ms/workspace/agent-sdlc-sample
npm install
npm run demo -- --port 5173
```

보여줄 변화는 브라우저에서 만듭니다.

| 순서 | 조작 | 보여줄 변화 |
| --- | --- | --- |
| 1 | `리셋` 클릭 | `테스트 상태: retry test failing`, `하네스: blocked`, `파일럿: No-Go` |
| 2 | `Coupon API Bug` 클릭 | endpoint, retry signal, reproduction request 확인 |
| 3 | `Failed Tests` 클릭 | `Received balance delta: -2`, `received 2 redemption records` 확인 |
| 4 | `최소 패치 적용` 클릭 | `테스트 상태`가 `retry tests pass`로 변경 |
| 5 | `Harness Gate` 클릭 | `Affected unit tests`가 `PASS`로 변경되고 하네스가 `pass`로 변경 |
| 6 | `Pilot Go/No-Go` 클릭 | Decision이 `Go`로 변경 |

`최소 패치 적용` 버튼은 실제 파일을 수정하지 않습니다. 대신 같은 domain runner를 `buggy` 모드에서 `fixed` 모드로 전환해 쿠폰 결과, SLI/SLO, 하네스 gate, 파일럿 판단을 다시 계산합니다.

### 2. 실제 시나리오 runner 실행

패치 전 실패와 차단을 터미널에서 보여줍니다.

```bash
npm run demo:scenario -- --mode buggy
```

핵심 확인값은 아래와 같습니다.

```text
Balance: 2 -> 0 (delta -2)
Redemption records: 2
Duplicate charge detected: true
Harness: blocked
Pilot decision: No-Go
```

패치 후 통과 상태를 보여줍니다.

```bash
npm run demo:scenario -- --mode fixed
```

핵심 확인값은 아래와 같습니다.

```text
Balance: 2 -> 1 (delta -1)
Redemption records: 1
Reused first result: true
Harness: pass
Pilot decision: Go
```

문제가 생겼을 때는 JSON 계약으로 fallback할 수 있습니다.

```bash
npm run --silent demo:scenario -- --mode buggy --json
```

JSON에는 `mode`, `request`, `couponResult`, `sli`, `gates`, `summary`, `pilotDecision`이 포함됩니다.

### 3. 데모 서버 확인

별도 터미널에서 아래 명령으로 Vite 서버가 떠 있는지만 확인할 수 있습니다.

```bash
curl -sSf http://127.0.0.1:5173/ | head -n 5
```

이 명령은 데모 앱의 HTML이 응답하는지 확인하는 용도입니다. Coupon API 자체를 호출하는 명령이 아닙니다.

### 4. 테스트와 하네스 상태 확인

아래 명령은 실제 runner, artifact 하네스, JSON 계약이 기대대로 구성되어 있는지 확인합니다.

```bash
npm run test -- --reporter verbose
```

정상이라면 아래 테스트가 모두 통과합니다.

```text
✓ reproduces the duplicate charge in buggy mode
✓ reuses the first result in fixed mode
✓ blocks the harness for the real buggy scenario
✓ passes the harness for the real fixed scenario
✓ keeps the structured gate contract stable
```

여기서 buggy 테스트는 기본 검증을 깨는 실패 테스트가 아닙니다. `buggy` 모드가 중복 차감을 실제로 재현하고, 그 결과 하네스가 `blocked`로 판정하는지를 검증합니다.

전체 검증은 아래 명령으로 실행합니다.

```bash
npm run validate
```

`npm run validate`는 `npm run test`, `npm run build`, fixed mode strict harness를 순서대로 실행합니다. 발표 전에는 이 명령이 통과하는지 먼저 확인하고, 발표 중에는 브라우저에서 `리셋` -> `Failed Tests` -> `최소 패치 적용` -> `Harness Gate` 순서로 전후 변화를 보여주는 것이 가장 안정적입니다.

## 구현된 하네스 상세 설명

이 프로젝트의 하네스는 AI가 만든 패치를 그대로 신뢰하는 장치가 아닙니다. 같은 쿠폰 retry 시나리오를 실제 in-memory runner로 실행하고, 그 결과를 SLI/SLO, 정책 파일, 운영 준비 artifact와 함께 평가해 `blocked` 또는 `pass`를 결정하는 로컬 데모용 gate입니다.

하네스의 실행 흐름은 아래 순서입니다.

| 순서 | 단계 | 구현 위치 | 역할 |
| --- | --- | --- | --- |
| 1 | Demo fixture 로드 | `src/data/redeem-fixture.json` | `SPRING-20`, `demo-user-42`, `order-8842-retry-1` 더미 요청과 초기 잔액을 제공합니다. |
| 2 | Coupon runner 실행 | `src/domain/coupon.ts` | `buggy` 또는 `fixed` 모드로 같은 retry 요청을 두 번 처리합니다. |
| 3 | Scenario report 생성 | `src/lib/gateEvaluator.ts` | `mode`, `request`, `couponResult`, `sli`, `gates`, `summary`, `pilotMetrics`, `pilotDecision`을 하나의 `CouponScenarioReport`로 만듭니다. |
| 4 | Artifact gate 평가 | `config/harness.json`, `config/owners.json`, `config/observability.json`, `docs/rollback.md` | 테스트 결과뿐 아니라 owner, rollback, data boundary, observability readiness를 함께 확인합니다. |
| 5 | UI/CLI 출력 | `src/App.tsx`, `scripts/demoScenario.ts` | React 화면과 터미널 명령이 같은 `CouponScenarioReport`를 보여줍니다. |

### SLI/SLO 기준

기준값은 `config/harness.json`과 `config/observability.json`에 들어 있습니다.

| 항목 | fixed mode 기대값 | buggy mode 재현값 | 의미 |
| --- | --- | --- | --- |
| Balance delta | `-1` | `-2` | 같은 `idempotencyKey` retry는 쿠폰을 한 번만 차감해야 합니다. |
| Duplicate charge detected | `false` | `true` | 중복 차감이 감지되면 safe target을 벗어난 것입니다. |
| Reused first result | `true` | `false` | fixed mode는 첫 처리 결과를 재사용해야 합니다. |
| Harness blocked state | `false` | `true` | fixed strict harness는 통과해야 하고, buggy mode는 차단되어야 합니다. |
| Data boundary | `demo-only` | `demo-only` | 운영 로그나 고객 원문이 아니라 데모 fixture만 사용합니다. |
| Forbidden patterns | `0 hits` | `0 hits` | fixture, owner config, rollback note 안에 금지 패턴이 없어야 합니다. |

여기서 `Go`는 프로덕션 배포 승인이 아니라 이 로컬 데모/파일럿 하네스 기준을 통과했다는 뜻입니다. 실제 운영 트래픽, 실제 모니터링 백엔드, 실제 승인 워크플로까지 보장하는 것은 아닙니다.

### 8개 Gate

하네스는 `config/harness.json`의 `requiredGates`에 정의된 8개 gate를 평가합니다.

| Gate | Source | Pass 조건 | 실패 시 의미 |
| --- | --- | --- | --- |
| `scenario-reproduction` | `runner` | 현재 mode의 관측값이 `expectedModes`와 일치합니다. | runner 출력이 설정된 buggy/fixed 기대값과 달라 데모 재현성이 깨졌습니다. |
| `coupon-idempotency` | `runner` | 관측값이 `safeTarget`과 일치합니다: `balanceDelta=-1`, `duplicateChargeDetected=false`, `reusedResult=true`. | retry path가 안전 기준을 벗어났습니다. buggy mode에서는 이 gate가 실패해야 정상입니다. |
| `harness-config` | `config/harness.json` | required gates, buggy/fixed 기대값, 금지 패턴 목록이 모두 정의되어 있습니다. | 하네스 자체의 기준 파일이 누락되었거나 불완전합니다. |
| `owner-coverage` | `config/owners.json` | `coupon-redeem` owner가 있고 review requirement와 관련 path가 매핑되어 있습니다. | 변경 책임자와 리뷰 경계가 불명확합니다. 실제 리뷰 완료를 검증하는 gate는 아닙니다. |
| `rollback-ready` | `docs/rollback.md` | rollback trigger, owner, disable path, validation command가 문서에 있습니다. | 파일럿 중단과 복구 절차가 문서화되지 않았습니다. 실제 롤백 실행 여부를 검증하는 gate는 아닙니다. |
| `data-boundary` | `src/data/redeem-fixture.json` | fixture가 `demo-only`이고 허용된 `memberId`, `couponId` prefix를 사용합니다. | 운영 데이터나 허용되지 않은 식별자가 데모 입력에 섞였을 수 있습니다. |
| `observability-ready` | `config/observability.json` | duplicate charge alert, retry idempotency SLI, dashboard panel, review metric source가 설정되어 있습니다. | 관측성 준비 artifact가 부족합니다. 실시간 telemetry 수집을 검증하는 gate는 아닙니다. |
| `forbidden-patterns` | `config/harness.json forbiddenPatterns` | fixture, owner config, rollback note에서 금지 패턴이 0건입니다. | secret/customer-data 형태의 문자열이 데모 artifact에 포함됐을 수 있습니다. repo 전체 스캔은 아닙니다. |

`buggy` mode는 모든 gate가 실패하는 모드가 아닙니다. `scenario-reproduction`은 `balanceDelta=-2`, `duplicateChargeDetected=true`를 기대값대로 재현했기 때문에 통과합니다. 대신 `coupon-idempotency`가 safe target과 맞지 않아 하네스가 `blocked`가 됩니다.

`fixed` mode는 현재 artifact들이 모두 존재하고 조건을 만족할 때 `pass`가 됩니다. `fixed`라도 rollback 문서, observability config, data boundary fixture, owner config가 누락되거나 깨지면 하네스는 `blocked`로 바뀝니다.

### CLI 옵션과 Exit 정책

하네스 CLI는 `scripts/demoScenario.ts`에 있습니다.

| 명령 | 용도 |
| --- | --- |
| `npm run demo:scenario -- --mode buggy` | 중복 차감 재현과 `blocked` 판정을 터미널에서 보여줍니다. 기본적으로 exit code는 성공입니다. |
| `npm run demo:scenario -- --mode fixed` | idempotency fix가 적용된 안전 경로와 `pass` 판정을 보여줍니다. |
| `npm run --silent demo:scenario -- --mode buggy --json` | 같은 `CouponScenarioReport`를 JSON으로 출력합니다. `--json`은 출력 형식만 바꾸고 판정은 바꾸지 않습니다. |
| `npm run demo:scenario -- --mode fixed --strict` | `summary.blocked=true`이면 non-zero exit로 실패합니다. |
| `npm run harness:strict` | fixed mode strict harness를 실행합니다. |
| `npm run validate` | `test`, `build`, fixed strict harness를 순서대로 실행합니다. |

`--mode`를 생략하면 CLI는 기본값으로 `fixed`를 사용합니다. 발표 중 실패 장면을 보여줄 때는 반드시 `--mode buggy`를 명시합니다.

### 장애 시나리오와 대응

| 시나리오 | 감지 gate | 기대 판정 | 대응 |
| --- | --- | --- | --- |
| retry 중복 차감 발생 | `coupon-idempotency` | `blocked`, Pilot `No-Go` | `npm run demo:scenario -- --mode buggy`로 증거를 보여준 뒤 fixed path를 확인합니다. |
| rollback 또는 observability artifact 누락 | `rollback-ready`, `observability-ready` | `blocked` | `docs/rollback.md`와 `config/observability.json`을 복구한 뒤 `npm run harness:strict`를 다시 실행합니다. |
| demo boundary 밖 데이터 또는 금지 패턴 유입 | `data-boundary`, `forbidden-patterns` | `blocked` | fixture와 artifact에서 운영 데이터/금지 문자열을 제거하고 JSON fallback으로 evidence를 확인합니다. |

No-Go가 나오면 `npm run --silent demo:scenario -- --mode buggy --json`으로 구조화된 evidence를 확보하고, `docs/rollback.md`의 disable path와 traffic action을 따른 뒤 `npm run harness:strict`로 fixed path를 재검증합니다.

## 발표 전 점검

발표 전에 한 번 실행해 두면 좋습니다.

```bash
npm run validate
npm run demo:scenario -- --mode buggy
npm run demo:scenario -- --mode fixed
npm run lint
```

`npm run validate`는 테스트, 빌드, fixed strict harness를 함께 실행합니다. 데모 URL이 떠 있는지 확인하려면 다음 명령을 사용할 수 있습니다.

```bash
curl -sSf http://127.0.0.1:5173/ | head -n 5
```

## 화면 구성

- 상단 컨트롤: `이전`, `다음 단계`, `GitHub Pipeline`, `Failed Tests 보기`, `최소 패치 적용`, `리셋`
- 왼쪽 타임라인: 강의 슬라이드 범위와 데모 단계
- 중앙 패널: 현재 단계 설명, 강의와 데모 연결 문장, 실제 데모 화면
- 오른쪽 Evidence: 해당 단계에서 발표자가 근거로 짚을 산출물

처음 상태는 패치가 적용되지 않은 상태입니다. `Failed Tests`에서는 retry test가 실패하고, `Harness`와 `Pilot`은 blocked 또는 No-Go 상태로 보입니다. 이미 패치가 적용된 화면이라면 `리셋`을 누르고 다시 시작합니다.

## 상세 사용법

### 1. 발표 준비 순서

1. 발표 덱을 먼저 엽니다.
	- `aibuild-squad/output/260527_seminar/agentic-sdlc-seminar-swiper-design-2026-05-27.html`
2. 이 데모 앱을 `http://127.0.0.1:5173/`으로 엽니다.
3. 브라우저 탭을 발표 덱과 데모 앱 두 개로 나눠 둡니다.
4. 데모 앱에서 `리셋`을 눌러 초기 상태를 맞춥니다.
5. 상태 요약이 아래처럼 보이는지 확인합니다.
	- 현재 단계: `1. Coupon API Bug`
	- 테스트 상태: `retry test failing`
	- 하네스: `blocked`
	- 파일럿: `No-Go`
6. 슬라이드 4부터 데모 앱의 왼쪽 단계 번호와 맞춰 진행합니다.

### 2. 버튼 사용법

| 버튼 | 사용 시점 | 설명 |
| --- | --- | --- |
| `이전` | 흐름을 되돌릴 때 | 현재 단계의 바로 앞 단계로 이동합니다. 첫 단계에서는 비활성화됩니다. |
| `다음 단계` | 순서대로 시연할 때 | `Coupon API Bug`부터 `Pilot Go/No-Go`까지 한 단계씩 이동합니다. |
| `GitHub Pipeline` | GitHub 연동 흐름을 바로 보여줄 때 | Issue, Assign to Copilot, generated PR, required checks, CODEOWNERS 흐름으로 이동합니다. |
| `최소 패치 적용` | `Failed Tests`를 보여준 직후 | 실패 로그를 바탕으로 최소 패치가 적용된 상태로 전환합니다. 이 버튼을 누른 뒤 Harness와 Pilot 판단이 바뀝니다. |
| `리셋` | 발표 시작 전, 흐름이 꼬였을 때 | `Coupon API Bug`, failing test, blocked harness, No-Go 상태로 되돌립니다. |

가장 중요한 규칙은 `최소 패치 적용`을 너무 일찍 누르지 않는 것입니다. 먼저 `Failed Tests`에서 실패와 차단을 충분히 보여준 다음 눌러야 하네스 메시지가 살아납니다.

### 3. 상태 전이

| 시점 | 테스트 상태 | 하네스 | 파일럿 | 의미 |
| --- | --- | --- | --- | --- |
| 초기 상태 | `retry test failing` | `blocked` | `No-Go` | AI PR이 도착했지만 retry test가 실패해 머지와 확산을 막는 상태입니다. |
| `최소 패치 적용` 이후 | `retry tests pass` | `pass` | `Go` | 실패 로그를 반영한 최소 패치가 적용되어 required checks와 파일럿 기준을 통과한 상태입니다. |

발표에서는 이 전이를 “AI가 잘했다”가 아니라 “실패가 안전하게 드러났고, 하네스가 통과 기준을 확인했다”로 설명합니다.

### 4. 상세 진행표

| 순서 | 앱 조작 | 화면에서 짚을 것 | 말할 문장 예시 |
| --- | --- | --- | --- |
| 0 | `리셋` 클릭 | 상태 요약의 failing, blocked, No-Go | “처음 상태는 아직 안전하지 않습니다. 그래서 성공이 아니라 실패와 차단부터 보겠습니다.” |
| 1 | `Coupon API Bug` | endpoint, signal, reproduction request | “바로 고쳐달라고 하지 않고, 재현 가능한 작업 계약으로 바꿉니다.” |
| 2 | `Acceptance Criteria` | AC-1~AC-4, 연결된 test id | “Agent Mode의 첫 가치는 코드 생성이 아니라 질문 생성과 AC 정리입니다.” |
| 3 | `GitHub Codegen Pipeline` | Issue, labels, Assign to Copilot, PR Checks, CODEOWNERS | “코드 자동생성은 GitHub 이슈 계약과 required checks 안에서 움직이게 합니다.” |
| 4 | `Coding Agent PR` | changed files, PR description, required checks | “Coding Agent에는 큰 문제 전체가 아니라 좁고 검증 가능한 PR 계약만 맡깁니다.” |
| 5 | `Failed Tests` | retry test FAIL 로그, blocked 상태 | “오늘 데모의 핵심은 AI PR이 실패하는 순간입니다. 하네스는 이 실패를 숨기지 않고 머지를 막습니다.” |
| 6 | `최소 패치 적용` | 버튼 클릭 후 상태 변화 | “실패 로그를 다음 입력으로 바꿔 최소 패치만 적용합니다.” |
| 7 | `Harness Gate` | unit, owner config, data boundary, observability, rollback PASS | “PASS는 AI를 믿는다는 뜻이 아니라, 구조 검증을 통과했다는 뜻입니다.” |
| 8 | `Pilot Go/No-Go` | Decision: Go, 파일럿 지표 | “확산 판단은 기능표가 아니라 데이터 경계, observability, required checks, 리뷰 p95 같은 운영 기준으로 닫습니다.” |

### 5. 시간별 진행 옵션

| 사용 가능 시간 | 추천 단계 | 운영 방식 |
| --- | --- | --- |
| 3분 | `Coupon API Bug` -> `Failed Tests` -> `최소 패치 적용` -> `Harness Gate` | 메시지만 빠르게 전달합니다. 실패와 PASS 전환을 중심으로 보여줍니다. |
| 7분 | 전체 7단계 | 왼쪽 타임라인을 순서대로 누르며 각 단계의 Evidence를 한 문장씩 짚습니다. |
| 12분 이상 | 전체 7단계 + Pilot 설명 | Pilot Go/No-Go 지표와 실제 팀 도입 기준까지 연결합니다. |

### 6. 발표 중 탭 전환 방식

- Slides 1-3: 발표 덱만 사용합니다.
- Slides 4-8: 데모 앱으로 전환해 `Coupon API Bug`를 보여줍니다.
- Slide 9: `Acceptance Criteria`로 이동합니다.
- Slides 10-13: `GitHub Codegen Pipeline`과 `Coding Agent PR`로 이동합니다.
- Slides 14-15: `Failed Tests`를 보여주고, 패치 버튼은 아직 누르지 않습니다.
- Slides 16-18: `최소 패치 적용`을 누른 뒤 `Harness Gate`를 보여줍니다.
- Slides 19-21: `Pilot Go/No-Go`로 마무리합니다.

슬라이드와 데모 앱을 동시에 설명하려고 하지 말고, 슬라이드에서 개념을 말한 뒤 데모 앱으로 전환해 한 장면만 보여주는 방식이 가장 안정적입니다.

## 강의 슬라이드 연결

| Slides | Demo stage | 발표 중 조작 | 설명 포인트 |
| --- | --- | --- | --- |
| 4-9 | `Coupon API Bug` | 버그를 바로 고치지 않고 endpoint, signal, reproduction request를 보여줍니다. | 모호한 이슈를 재현 가능한 작업 계약으로 바꿉니다. |
| 9 | `Acceptance Criteria` | AC와 test id가 코드보다 먼저 정리되는 장면을 보여줍니다. | Agent Mode의 첫 가치는 코드 생성이 아니라 질문 생성과 AC 정리입니다. |
| 10-13 | `GitHub Codegen Pipeline` | Issue, Assign to Copilot, generated PR, PR Checks 흐름을 보여줍니다. | 코드 자동생성은 GitHub 라벨, 템플릿, required checks 안에서 실행됩니다. |
| 13 | `Coding Agent PR` | changed files와 PR description을 보여줍니다. | Coding Agent에는 큰 문제 전체가 아니라 좁고 검증 가능한 PR 계약만 맡깁니다. |
| 14-15 | `Failed Tests` | FAIL 로그와 blocked 상태를 먼저 보여주고, 아직 패치 버튼은 누르지 않습니다. | AI PR이 실패하고 required checks가 머지를 막는 장면이 핵심입니다. |
| 16-18 | `Harness Gate` | `최소 패치 적용`을 누른 뒤 PASS 전환과 evidence를 보여줍니다. | 실패 로그를 다음 입력으로 바꾸고 하네스가 구조 검증을 수행합니다. |
| 19-21 | `Pilot Go/No-Go` | 패치 전 No-Go와 패치 후 Go 판단 기준을 연결합니다. | 확산 판단은 기능표가 아니라 데이터 경계, required checks, 리뷰 p95 같은 운영 기준으로 닫습니다. |

## 추천 시연 순서

1. `리셋`을 눌러 초기 상태를 맞춥니다.
2. `Coupon API Bug`에서 endpoint, signal, reproduction request를 보여줍니다.
3. `Acceptance Criteria`에서 AC와 test id를 읽어줍니다.
4. `GitHub Codegen Pipeline`에서 Issue, Assign to Copilot, generated PR, PR Checks 연결선을 보여줍니다.
5. `Coding Agent PR`에서 changed files와 PR description을 보여줍니다.
6. `Failed Tests`에서 retry test FAIL과 blocked 상태를 강조합니다.
7. `최소 패치 적용`을 누릅니다.
8. `Harness Gate`에서 unit, owner config, data boundary, observability, rollback 조건이 PASS로 바뀌는 것을 보여줍니다.
9. `Pilot Go/No-Go`에서 Decision이 Go로 바뀌는 기준을 설명합니다.

시간이 부족하면 `Coupon API Bug`, `Failed Tests`, `Harness Gate`, `Pilot Go/No-Go`만 보여도 전체 메시지는 유지됩니다.

## 발표자가 강조할 메시지

- 이 데모는 “AI가 한 번에 정답 코드를 만들었다”를 보여주기 위한 것이 아닙니다.
- 핵심은 모호한 이슈를 AC와 테스트 가능한 계약으로 바꾸는 것입니다.
- AI PR은 완성이 아니라 리뷰 요청입니다.
- 실패 테스트는 데모 실패가 아니라 하네스의 가치가 드러나는 장면입니다.
- `최소 패치 적용`은 큰 리팩터링이 아니라 failing path만 고치는 예시입니다.
- `Harness Gate`의 PASS는 도메인 판단까지 끝났다는 뜻이 아니라, 팀이 정한 구조 검증을 통과했다는 뜻입니다.
- `Pilot Go/No-Go`는 도구 기능표가 아니라 운영 지표로 확산 여부를 판단하는 장면입니다.

## 파일 구조

| 경로 | 역할 |
| --- | --- |
| `src/App.tsx` | 데모 화면, 버튼, 단계별 렌더링을 담당합니다. |
| `src/domain/coupon.ts` | buggy/fixed 쿠폰 retry 시나리오를 실제 in-memory 로직으로 실행합니다. |
| `src/lib/gateEvaluator.ts` | CouponScenarioReport, SLI/SLO, artifact gate, Pilot 판단을 계산합니다. |
| `config/harness.json` | safe target, expected mode, required gate, 금지 패턴을 정의합니다. |
| `config/owners.json` | coupon artifact owner와 review requirement를 정의합니다. |
| `config/observability.json` | duplicate charge alert, retry SLI, dashboard, review p95 fixture를 정의합니다. |
| `docs/rollback.md` | rollback trigger, owner, disable path, traffic action, validation command를 정의합니다. |
| `.github/ISSUE_TEMPLATE/copilot-codegen-task.yml` | GitHub Issue에서 Copilot 코드 생성 작업으로 넘길 입력 계약을 정의합니다. |
| `.github/pull_request_template.md` | AI-assisted PR의 evidence, 금지 데이터, rollback 체크리스트를 정의합니다. |
| `.github/workflows/ci.yml` | PR required checks로 사용할 lint, test, build, strict harness workflow 예시입니다. |
| `.github/CODEOWNERS` | GitHub Rulesets와 함께 owner review gate를 표현합니다. |
| `src/data/scenario.ts` | 쿠폰 API 버그, AC, PR, Evidence를 담고 있습니다. |
| `src/lib/demoRunner.ts` | 이전/다음 단계 이동 순서를 정의합니다. |
| `scripts/demoScenario.ts` | `buggy/fixed` scenario CLI와 JSON fallback을 제공합니다. |
| `demo-guide.md` | 발표자가 짧게 참고할 수 있는 별도 진행표입니다. |

## 데모 구성 데이터

- `Coupon API Bug`: 모호한 버그 리포트와 재현 요청
- `Acceptance Criteria`: Agent Mode가 만든 AC와 테스트 후보
- `GitHub Codegen Pipeline`: Issue, Assign to Copilot, generated PR, required checks, CODEOWNERS 연결
- `Coding Agent PR`: 좁은 이슈를 위임해 만든 PR 형태
- `Failed Tests`: retry 테스트 실패와 required checks 차단
- `Harness Gate`: unit, owner config, data boundary, observability, forbidden pattern, rollback 조건
- `Pilot Go/No-Go`: 2주 파일럿 판단 기준과 demo fixture 기반 review p95

## 스크립트

- `npm run dev`: Vite 개발 서버 실행
- `npm run demo`: 발표용 host를 `127.0.0.1`로 고정해 Vite 실행
- `npm run demo:scenario -- --mode buggy`: 중복 차감과 blocked 하네스를 실제 runner로 재현
- `npm run demo:scenario -- --mode fixed`: idempotent retry와 pass 하네스를 실제 runner로 확인
- `npm run --silent demo:scenario -- --mode buggy --json`: JSON fallback 출력
- `npm run harness:strict`: fixed mode strict harness 실행
- `npm run test`: Vitest 테스트 실행
- `npm run build`: TypeScript와 Vite 빌드 실행
- `npm run lint`: ESLint 실행
- `npm run validate`: 테스트, 빌드, fixed strict harness를 순서대로 실행

## 문제 대응

- URL이 열리지 않으면 `npm run demo -- --port 5173`이 실행 중인지 확인합니다.
- 5173 포트가 사용 중이면 기존 dev server를 종료하거나, Vite가 출력한 새 URL을 발표자 스크립트에 맞춰 말로 안내합니다.
- 화면이 이미 Go 상태라면 `리셋`을 누르고 다시 시작합니다.
- 패치 버튼을 너무 일찍 눌렀다면 `리셋` 후 `Failed Tests` 단계까지 다시 진행합니다.
- 라이브 화면이 흔들리면 “자동화는 실패할 수 있으므로 실패를 드러내고 되돌리는 하네스가 필요하다”는 메시지로 전환합니다.
