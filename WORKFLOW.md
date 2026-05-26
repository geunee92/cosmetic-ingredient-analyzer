# WORKFLOW.md

> 브랜치 / 커밋 / PR / 배포 워크플로우.

## 1. 브랜치 전략

1인 프로젝트라 단순화:
- `main`: 항상 배포 가능한 상태
- `feature/<name>`: 신규 기능
- `fix/<name>`: 버그 수정
- `docs/<name>`: 문서만 (선택)
- `refactor/<name>`: 리팩터링

`main`에 직접 push는 Day 0~1의 초기 셋업에서만 허용. 이후 PR 권장 (self-review).

## 2. 커밋 컨벤션 (Conventional Commits 변형)

### 형식
```
<Type>(<scope>): <헤더 한 줄, 동사형 명사 종결>

<본문 — "왜"를 1~2줄, "무엇을"은 diff가 말함>

Refs: SPEC.md §N (관련 있을 때)
```

### Type
- `Feat`: 신규 기능
- `Fix`: 버그 수정
- `Refactor`: 동작 변화 없는 구조 변경
- `Test`: 테스트 추가/수정
- `Docs`: 문서만
- `Build`: 빌드/툴/의존성

### Scope (선택)
- `(api)`: 서버리스
- `(ui)`: 클라이언트 컴포넌트
- `(store)`: Zustand
- `(harness)`: AI harness 문서
- `(data)`: 정적 데이터
- `(a11y)`: 접근성
- `(spec)`: SPEC.md

### 규칙
- **한 커밋 = 한 가지 변화**. 여러 도메인 섞으면 분할
- 테스트와 구현은 분리 (`Feat:` → `Test:` 순서)
- 헤더는 한 줄에 명사형 종결 ("추가", "구현", "정비")
- 본문은 "왜"만. "무엇을"은 diff 참조

### 예시
```
Feat(api): withFallback 멀티 provider 오케스트레이션

폴백 트리거 8가지 (network/rate_limit/timeout/invalid_output/
content_filter/auth/bad_request/unknown) 중 auth/bad_request는
즉시 throw해 사용자 quota 보호.

Refs: SPEC.md §5 에러 분류, §9 폴백 카운터 정책
```

## 3. PR 컨벤션

1인 프로젝트라 self-review.

### PR 생성
- `/pr` 슬래시 커맨드 사용 (`.claude/commands/pr.md`)
- 자동으로 commit history → PR 본문 생성

### Self-review 체크리스트
- [ ] SPEC.md 갱신 필요한 변경인가? 미갱신 시 추가
- [ ] 커밋이 기능 단위로 분리되어 있는가?
- [ ] 테스트가 핵심 로직을 커버하는가?
- [ ] LESSONS.md에 추가할 새 교훈이 있는가?

## 4. 배포

### 자동
- `main` 브랜치 push → Vercel 자동 빌드/배포 (production)
- PR 생성 → Vercel preview deployment

### 환경변수
- 로컬: `.env.local`
- 프로덕션/preview: Vercel 대시보드 → Settings → Environment Variables

## 5. 시크릿 관리

- `.env.local`은 절대 commit X (`.gitignore` 포함)
- `.env.sample`은 placeholder만, commit 가능
- Vercel KV 토큰은 Vercel 대시보드에서 자동 주입 (직접 입력 X)

## 6. 테스트 정책

- Vitest 한글 describe/it (CODE_CONVENTION.md 참조)
- 핵심 로직(`fallback.ts`, `schema.ts`, `rateLimit.ts`)은 100% 커버리지 목표
- UI 컴포넌트는 happy path만 (Testing Library 추가 시점에 결정)
- 통합 테스트는 `tests/api/`에 별도 파일
