# Agentic SDLC Demo

Agentic SDLC 세미나에서 함께 실행할 수 있는 React 기반 UI 데모입니다. 발표 스토리라인은 `쿠폰 API 버그 -> AC 생성 -> Coding Agent PR -> 실패 테스트 -> Harness 게이트 -> 파일럿 Go/No-Go` 순서로 구성되어 있습니다.

## 실행

```bash
npm install
npm run demo
```

기본 주소는 Vite가 출력하는 로컬 URL입니다. 발표 중에는 브라우저를 전체 화면으로 띄우고 왼쪽 타임라인 또는 상단 버튼으로 단계를 이동하면 됩니다.

## 검증

```bash
npm run test
npm run build
npm run validate
```

## 데모 구성

- `Coupon API Bug`: 모호한 버그 리포트와 재현 요청
- `Acceptance Criteria`: Agent Mode가 만든 AC와 테스트 후보
- `Coding Agent PR`: 좁은 이슈를 위임해 만든 PR 형태
- `Failed Tests`: retry 테스트 실패와 required checks 차단
- `Harness Gate`: unit, label, CODEOWNERS, secret scan, rollback 조건
- `Pilot Go/No-Go`: 2주 파일럿 판단 기준

## 발표 메시지

이 데모의 핵심은 AI가 한 번에 코드를 맞히는 장면이 아닙니다. AI PR이 실패했을 때 테스트와 하네스가 안전하게 막고, 실패 로그를 다시 입력으로 바꿔 수정하는 장면입니다.
