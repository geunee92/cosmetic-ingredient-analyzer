# Claude Code 설정

> 이 문서는 Claude Code가 자동 로드하는 진입점입니다.

## 필수: AGENTS.md 먼저 읽기

**작업을 시작하기 전에 반드시 [`AGENTS.md`](./AGENTS.md)를 읽으세요.**
프로젝트 구조, 코드 탐색 가이드, 개발 명령어가 포함되어 있습니다.

## Spec-Driven 원칙

본 프로젝트는 **명세 → 사전 점검 → 구현** 순서로 개발합니다.
모든 기능 변경은 [`SPEC.md`](./SPEC.md)의 관련 섹션에 정의된 뒤 구현하세요.
커밋 메시지 본문에 `Refs: SPEC.md §N` 으로 명세-구현 추적을 유지합니다.

## 코드 작성 원칙

### 컨벤션 (`CODE_CONVENTION.md`)

**파일/기능 생성 시 [`CODE_CONVENTION.md`](./CODE_CONVENTION.md)를 따르세요.**

5대 핵심:
- **Props**: `interface` 대신 `type` alias 사용
- **Export**: `export const` (Named Export). default export 금지
- **로직/뷰 분리**: 로직은 훅(`useXxx`)에, 뷰는 컴포넌트에
- **스타일**: emotion `styled` 또는 `css` prop. 컴포넌트 폴더의 `style.ts`로 분리
- **상태 관리**: Zustand (client). 서버 상태는 fetch wrapper(`lib/api.ts`)에서 직접 처리 (1인 프로젝트라 React Query 미도입)

### 보안 ([`SECURITY.md`](./SECURITY.md))

**작업 시작 전 SECURITY.md 확인.**

특히:
- AI API 키는 `src/` 어디서도 import 금지. `api/` 서버 코드에서만 사용
- `VITE_*` 접두사로 키 노출 금지
- 사용자 입력은 system 프롬프트가 아닌 user 메시지에만

### 학습 루프 ([`LESSONS.md`](./LESSONS.md))

- 작업 시작 전 `LESSONS.md`에서 관련 교훈 확인
- 작업 중 새로운 실수/발견이 있으면 `LESSONS.md`에 추가 제안

## 참조 문서

| 문서 | 용도 |
|---|---|
| [`SPEC.md`](./SPEC.md) | 제품/API/데이터/엣지 명세 (변경 시 먼저 갱신) |
| [`AGENTS.md`](./AGENTS.md) | AI 진입 지식맵 |
| [`CODE_CONVENTION.md`](./CODE_CONVENTION.md) | 폴더 구조 / 네이밍 / 컴포넌트 패턴 |
| [`SECURITY.md`](./SECURITY.md) | 금지 패턴 / 키 관리 |
| [`WORKFLOW.md`](./WORKFLOW.md) | 브랜치 / 커밋 / 배포 |
| [`LESSONS.md`](./LESSONS.md) | 누적 학습 기록 |

## 작업 지침

- 요청받은 것만 정확히 수행하세요
- 불필요한 파일 생성을 지양하세요
- 문서화 파일(README, 가이드 등)은 명시적 요청이 있을 때만 생성하세요
- **PR 생성**: `/pr` 스킬 사용 (`.claude/commands/pr.md`)
