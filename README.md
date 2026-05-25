# Agentic SDLC Demo

Agentic SDLC 세미나에서 함께 실행하는 React 기반 발표용 데모입니다. 발표 스토리라인은 `쿠폰 API 버그 -> AC 생성 -> Coding Agent PR -> 실패 테스트 -> Harness Gate -> Pilot Go/No-Go` 순서로 구성되어 있습니다.

이 데모는 실제 운영계를 건드리는 라이브 코딩이 아니라, 강의 슬라이드와 맞춰 보여주는 상태 기반 UI입니다. 핵심은 AI가 한 번에 코드를 맞히는 장면이 아니라, AI PR이 실패했을 때 테스트와 하네스가 안전하게 막고, 실패 로그를 다시 입력으로 바꿔 수정하는 장면입니다.

## 빠른 실행

발표 기준 URL은 `http://127.0.0.1:5173/`입니다.

```bash
cd /Users/hacbook/ms/workspace/agent-sdlc-sample
npm install
npm run demo -- --port 5173
```

브라우저에서 `http://127.0.0.1:5173/`을 열고 전체 화면으로 띄웁니다. 발표 중에는 왼쪽 타임라인 또는 상단 버튼으로 단계를 이동합니다.

## 발표 전 점검

발표 전에 한 번 실행해 두면 좋습니다.

```bash
npm run validate
npm run lint
```

`npm run validate`는 테스트와 빌드를 함께 실행합니다. 데모 URL이 떠 있는지 확인하려면 다음 명령을 사용할 수 있습니다.

```bash
curl -sSf http://127.0.0.1:5173/ | head -n 5
```

## 화면 구성

- 상단 컨트롤: `이전`, `다음 단계`, `최소 패치 적용`, `리셋`
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
| 3 | `Coding Agent PR` | changed files, PR description, required checks | “Coding Agent에는 큰 문제 전체가 아니라 좁고 검증 가능한 PR 계약만 맡깁니다.” |
| 4 | `Failed Tests` | retry test FAIL 로그, blocked 상태 | “오늘 데모의 핵심은 AI PR이 실패하는 순간입니다. 하네스는 이 실패를 숨기지 않고 머지를 막습니다.” |
| 5 | `최소 패치 적용` | 버튼 클릭 후 상태 변화 | “실패 로그를 다음 입력으로 바꿔 최소 패치만 적용합니다.” |
| 6 | `Harness Gate` | unit, label, secret scan, CODEOWNERS, rollback PASS | “PASS는 AI를 믿는다는 뜻이 아니라, 구조 검증을 통과했다는 뜻입니다.” |
| 7 | `Pilot Go/No-Go` | Decision: Go, 파일럿 지표 | “확산 판단은 기능표가 아니라 데이터 경계, required checks, 리뷰 p95 같은 운영 기준으로 닫습니다.” |

### 5. 시간별 진행 옵션

| 사용 가능 시간 | 추천 단계 | 운영 방식 |
| --- | --- | --- |
| 3분 | `Coupon API Bug` -> `Failed Tests` -> `최소 패치 적용` -> `Harness Gate` | 메시지만 빠르게 전달합니다. 실패와 PASS 전환을 중심으로 보여줍니다. |
| 7분 | 전체 6단계 | 왼쪽 타임라인을 순서대로 누르며 각 단계의 Evidence를 한 문장씩 짚습니다. |
| 12분 이상 | 전체 6단계 + Pilot 설명 | Pilot Go/No-Go 지표와 실제 팀 도입 기준까지 연결합니다. |

### 6. 발표 중 탭 전환 방식

- Slides 1-3: 발표 덱만 사용합니다.
- Slides 4-9: 데모 앱으로 전환해 `Coupon API Bug`를 보여줍니다.
- Slide 10: `Acceptance Criteria`로 이동합니다.
- Slides 11-14: `Coding Agent PR`로 이동합니다.
- Slides 15-16: `Failed Tests`를 보여주고, 패치 버튼은 아직 누르지 않습니다.
- Slides 17-19: `최소 패치 적용`을 누른 뒤 `Harness Gate`를 보여줍니다.
- Slides 20-23: `Pilot Go/No-Go`로 마무리합니다.

슬라이드와 데모 앱을 동시에 설명하려고 하지 말고, 슬라이드에서 개념을 말한 뒤 데모 앱으로 전환해 한 장면만 보여주는 방식이 가장 안정적입니다.

## 강의 슬라이드 연결

| Slides | Demo stage | 발표 중 조작 | 설명 포인트 |
| --- | --- | --- | --- |
| 4-9 | `Coupon API Bug` | 버그를 바로 고치지 않고 endpoint, signal, reproduction request를 보여줍니다. | 모호한 이슈를 재현 가능한 작업 계약으로 바꿉니다. |
| 10 | `Acceptance Criteria` | AC와 test id가 코드보다 먼저 정리되는 장면을 보여줍니다. | Agent Mode의 첫 가치는 코드 생성이 아니라 질문 생성과 AC 정리입니다. |
| 11-14 | `Coding Agent PR` | changed files와 PR description을 보여줍니다. | Coding Agent에는 큰 문제 전체가 아니라 좁고 검증 가능한 PR 계약만 맡깁니다. |
| 15-16 | `Failed Tests` | FAIL 로그와 blocked 상태를 먼저 보여주고, 아직 패치 버튼은 누르지 않습니다. | AI PR이 실패하고 required checks가 머지를 막는 장면이 핵심입니다. |
| 17-19 | `Harness Gate` | `최소 패치 적용`을 누른 뒤 PASS 전환과 evidence를 보여줍니다. | 실패 로그를 다음 입력으로 바꾸고 하네스가 구조 검증을 수행합니다. |
| 20-23 | `Pilot Go/No-Go` | 패치 전 No-Go와 패치 후 Go 판단 기준을 연결합니다. | 확산 판단은 기능표가 아니라 데이터 경계, required checks, 리뷰 p95 같은 운영 기준으로 닫습니다. |

## 추천 시연 순서

1. `리셋`을 눌러 초기 상태를 맞춥니다.
2. `Coupon API Bug`에서 endpoint, signal, reproduction request를 보여줍니다.
3. `Acceptance Criteria`에서 AC와 test id를 읽어줍니다.
4. `Coding Agent PR`에서 changed files와 PR description을 보여줍니다.
5. `Failed Tests`에서 retry test FAIL과 blocked 상태를 강조합니다.
6. `최소 패치 적용`을 누릅니다.
7. `Harness Gate`에서 unit, label, CODEOWNERS, secret scan, rollback 조건이 PASS로 바뀌는 것을 보여줍니다.
8. `Pilot Go/No-Go`에서 Decision이 Go로 바뀌는 기준을 설명합니다.

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
| `src/data/scenario.ts` | 쿠폰 API 버그, AC, PR, 테스트 로그, Evidence, Pilot 지표를 담고 있습니다. |
| `src/lib/gateEvaluator.ts` | 패치 적용 전후 Harness와 Pilot 판단을 계산합니다. |
| `src/lib/demoRunner.ts` | 이전/다음 단계 이동 순서를 정의합니다. |
| `demo-guide.md` | 발표자가 짧게 참고할 수 있는 별도 진행표입니다. |

## 데모 구성 데이터

- `Coupon API Bug`: 모호한 버그 리포트와 재현 요청
- `Acceptance Criteria`: Agent Mode가 만든 AC와 테스트 후보
- `Coding Agent PR`: 좁은 이슈를 위임해 만든 PR 형태
- `Failed Tests`: retry 테스트 실패와 required checks 차단
- `Harness Gate`: unit, label, CODEOWNERS, secret scan, rollback 조건
- `Pilot Go/No-Go`: 2주 파일럿 판단 기준

## 스크립트

- `npm run dev`: Vite 개발 서버 실행
- `npm run demo`: 발표용 host를 `127.0.0.1`로 고정해 Vite 실행
- `npm run test`: Vitest 테스트 실행
- `npm run build`: TypeScript와 Vite 빌드 실행
- `npm run lint`: ESLint 실행
- `npm run validate`: 테스트와 빌드를 순서대로 실행

## 문제 대응

- URL이 열리지 않으면 `npm run demo -- --port 5173`이 실행 중인지 확인합니다.
- 5173 포트가 사용 중이면 기존 dev server를 종료하거나, Vite가 출력한 새 URL을 발표자 스크립트에 맞춰 말로 안내합니다.
- 화면이 이미 Go 상태라면 `리셋`을 누르고 다시 시작합니다.
- 패치 버튼을 너무 일찍 눌렀다면 `리셋` 후 `Failed Tests` 단계까지 다시 진행합니다.
- 라이브 화면이 흔들리면 “자동화는 실패할 수 있으므로 실패를 드러내고 되돌리는 하네스가 필요하다”는 메시지로 전환합니다.
