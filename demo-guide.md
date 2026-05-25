# Demo Guide

이 가이드는 `Agentic SDLC 도입과 실행` 발표 중 데모를 진행할 때 사용하는 진행표입니다.

## 1. 시작

```bash
npm run demo -- --port 5173
```

브라우저에서 `http://127.0.0.1:5173/`을 열고 첫 화면의 `Coupon API Bug` 상태를 보여줍니다. 앱 왼쪽 단계에는 강의 슬라이드 범위가 함께 표시됩니다.

별도 터미널에서는 같은 runner를 먼저 실행해 실제 재현 값을 보여줍니다.

```bash
npm run demo:scenario -- --mode buggy
```

말할 문장:

> 오늘은 쿠폰 API 버그 하나를 끝까지 따라갑니다. 바로 코드를 고치는 것이 아니라, 이슈를 작업 계약으로 바꾸는 것부터 시작합니다.

## 2. 단계별 진행

1. Slides 4-9 · `Coupon API Bug`
   - 모호한 버그와 재현 요청을 보여줍니다.
   - 운영 로그 원문이 아니라 더미 데이터를 사용한다고 강조합니다.
   - 터미널에서 `balance delta -2`, `Duplicate charge detected: true`, `Harness: blocked`를 짚습니다.

2. Slide 10 · `Acceptance Criteria`
   - AC와 테스트 후보를 보여줍니다.
   - 좋은 PR은 좋은 질문에서 시작한다고 말합니다.

3. Slides 11-14 · `Coding Agent PR`
   - 작은 이슈만 비동기로 위임한다는 점을 강조합니다.
   - PR은 완성이 아니라 리뷰 요청이라고 설명합니다.

4. Slides 15-16 · `Failed Tests`
   - 첫 번째로는 실패 상태를 보여줍니다.
   - 이 실패가 하네스의 핵심 장면입니다.
   - 이 시점에는 `최소 패치 적용` 버튼을 아직 누르지 않습니다.
   - 필요하면 `npm run --silent demo:scenario -- --mode buggy --json`으로 gate evidence를 보여줍니다.

5. Slides 17-19 · `최소 패치 적용`
   - 상단의 `최소 패치 적용` 버튼을 누릅니다.
   - 테스트와 하네스 상태가 통과로 바뀌는 것을 보여줍니다.
   - 터미널에서 `npm run demo:scenario -- --mode fixed`를 실행해 같은 결과가 나오는지 확인합니다.

6. Slides 17-19 · `Harness Gate`
   - unit, owner config, data boundary, observability, forbidden patterns, rollback 조건을 보여줍니다.

7. Slides 20-23 · `Pilot Go/No-Go`
   - 파일럿은 속도만 보지 않고 보안, 리뷰 큐, required checks를 같이 본다고 마무리합니다.

## 3. 터미널 런북

발표 전에 아래 순서로 한 번 확인합니다.

```bash
npm run validate
npm run demo:scenario -- --mode buggy
npm run demo:scenario -- --mode fixed
```

발표 중 화면이 꼬이면 `리셋`을 누르고 아래 명령으로 텍스트 fallback을 보여줍니다.

```bash
npm run --silent demo:scenario -- --mode buggy --json
```

## 4. 실패했을 때 말할 문장

> 라이브 데모가 흔들리는 것 자체가 좋은 메시지입니다. 자동화는 언제든 실패할 수 있으므로, 실패를 안전하게 드러내고 되돌릴 수 있는 하네스가 필요합니다.

## 5. Q&A 연결

- Coding Agent는 언제 켜나? -> AC가 명확하고 변경 범위가 좁을 때
- 보안 검토는 자동화되나? -> 금지 입력과 정책 위반을 1차 차단하고 도메인 판단은 사람이 함
- 비용은 어떻게 보나? -> 작업 등급, 모델 라우팅, attribution으로 파일럿에서 측정
- 운영 자동화는 어디까지? -> 기본은 dry-run, L4 이상은 명시 승인과 감사 로그 필요
