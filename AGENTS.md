# AGENTS.md

> AI 에이전트가 본 프로젝트에서 작업을 시작할 때 **가장 먼저 읽는** 지식맵.

## 프로젝트 한 줄 정의

화장품 성분표(텍스트/이미지)를 입력하면 효능·주의·알레르기·국가별 규제(KR/MoCRA/CPNP)를 AI로 분석해 카드로 보여주는 **모바일 웹** 분석 도구. AI는 **OpenAI + Claude 멀티 폴백** 구조로 호출되고, 모든 분석은 **Vercel Functions** 안에서 실행된다.

## 필수 읽기 (작업 전)

| 문서 | 무엇을 얻는가 |
|---|---|
| [`SPEC.md`](./SPEC.md) | 기능/API/데이터/엣지 명세. 모든 결정의 근거 |
| [`SECURITY.md`](./SECURITY.md) | AI 키 관리 / 입력 검증 / Prompt Injection 대비 |
| [`LESSONS.md`](./LESSONS.md) | 과거 실수 — 같은 실수 반복 방지 |

## 상세 지식 (작업 중 참조)

| 문서 | 무엇을 얻는가 |
|---|---|
| [`CODE_CONVENTION.md`](./CODE_CONVENTION.md) | 폴더 구조 / 네이밍 / 컴포넌트 패턴 / 테스트 |
| [`WORKFLOW.md`](./WORKFLOW.md) | 브랜치 / 커밋 컨벤션 / 배포 |

## 폴더 구조 (핵심)

```
.
├── SPEC.md                   # 명세 (변경 전 먼저 갱신)
├── CLAUDE.md                 # Claude Code 진입점
├── AGENTS.md / CODE_CONVENTION.md / SECURITY.md / WORKFLOW.md / LESSONS.md
├── .claude/commands/pr.md    # /pr 슬래시 커맨드
│
├── api/                      # Vercel Functions (서버리스)
│   ├── analyze.ts            # POST /api/analyze 진입점
│   └── _lib/
│       ├── providers/        # AI provider 어댑터 (openai, claude)
│       ├── fallback.ts       # 멀티 provider 폴백 오케스트레이션
│       ├── prompt.ts         # 시스템 프롬프트 + few-shot
│       ├── schema.ts         # zod 스키마 (AnalysisResult)
│       ├── rateLimit.ts      # Vercel KV 기반 IP 일일 10회
│       └── errors.ts         # ProviderError 분류
│
├── src/                      # 클라이언트 (React + Vite)
│   ├── main.tsx / App.tsx
│   ├── styles/               # emotion theme / globals / mobileFrame
│   ├── components/           # base, common
│   ├── views/analyzer/       # 단일 도메인 (View/Hook/Style/Components 분리)
│   ├── store/                # Zustand
│   ├── lib/                  # api 클라이언트, format
│   ├── types/                # 공유 타입
│   └── data/                 # 정적 규제 사전 50개
│
└── tests/                    # Vitest (한글 describe/it)
    ├── api/                  # 폴백 / 스키마 / rate limit / 사전
    └── views/                # 훅 단위 테스트
```

## 코드 탐색 가이드

| 어디로 가야 하나 | 작업 종류 |
|---|---|
| `api/_lib/fallback.ts` | 멀티 provider 폴백 로직 / 에러 분류 변경 |
| `api/_lib/providers/openai.ts` 또는 `claude.ts` | provider별 SDK 호출 / 프롬프트 매핑 변경 |
| `api/_lib/schema.ts` | 응답 데이터 구조 변경 (반드시 SPEC §5 동시 갱신) |
| `api/_lib/rateLimit.ts` | Vercel KV 카운터 정책 변경 |
| `src/views/analyzer/hooks/useAnalyzer.ts` | 클라이언트 입력→API 호출 흐름 |
| `src/views/analyzer/components/IngredientCard/` | 결과 카드 UI |
| `src/store/analyzerStore.ts` | 클라이언트 상태 (idle/loading/done/error) |
| `src/data/regulations.ts` | 정적 규제 사전 (50개 큐레이션 추가) |

## 피해야 할 것

- ❌ AI API 키를 `src/`에서 import (보안 위반 — SECURITY.md)
- ❌ `VITE_*` 환경변수에 키 노출
- ❌ `default export` 사용 (CODE_CONVENTION 위반)
- ❌ View 컴포넌트에 직접 fetch / 로직 (훅으로 분리)
- ❌ 한 커밋에 여러 도메인 섞기 (`Feat(api): X` + `Feat(ui): Y` 동시 X)
- ❌ SPEC.md 미갱신 상태로 데이터 구조 변경
- ❌ `node_modules/`, `.env.local`, `dist/` 추적

## 개발 명령어

| 명령 | 용도 |
|---|---|
| `npm run dev` | Vite 개발 서버 (UI만) |
| `npm run api:dev` | `vercel dev` — Functions + UI 통합 |
| `npm test` | Vitest watch 모드 |
| `npm run test:run` | Vitest 단발 실행 (CI 용) |
| `npm run build` | 프로덕션 빌드 |

## 학습 루프 프로토콜

1. 작업 시작 전 [`LESSONS.md`](./LESSONS.md)에서 관련 교훈 검색
2. 작업 중 새로운 실수/발견이 있으면 `LESSONS.md`에 항목 추가
3. 추가 형식은 LESSONS.md 본문 참조
