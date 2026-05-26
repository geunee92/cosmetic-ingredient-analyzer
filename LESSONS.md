# LESSONS.md

> 개발 중 발견한 실수 / 함정 / 의외의 사실을 누적해 같은 실수 반복을 막는다.

## 프로토콜

1. **작업 시작 전**: 이 문서에서 관련 키워드 검색 (예: "rate limit", "OpenAI", "Vercel")
2. **작업 중 발견**: 새 항목 추가 (아래 형식)
3. **PR 머지 후**: 다음 작업자(또는 AI)가 같은 곳에서 멈추지 않도록

## 기록 형식

```markdown
### YYYY-MM-DD — <한 줄 요약>

- **상황**: 무엇을 하려 했나
- **문제**: 무엇이 발생했나
- **원인**: 왜 발생했나
- **해결**: 어떻게 풀었나
- **예방**: 다음 사람이 어떻게 피할 수 있나
```

---

## 누적 교훈

### 2026-05-26 — Vercel Functions의 stateless 환경에서 메모리 기반 rate limit은 무력

- **상황**: 토이 프로젝트에 가벼운 rate limit을 붙이려고 in-memory Map을 검토
- **문제**: Vercel Functions는 요청마다 instance가 다를 수 있어 카운터가 공유되지 않음
- **원인**: serverless는 stateless. 인스턴스 단위 메모리는 신뢰 불가
- **해결**: Vercel KV (Vercel-hosted Redis) 사용. INCR + EXPIRE 원자 연산
- **예방**: Functions 안에서 카운터·중복방지·세션을 다룰 때는 항상 외부 저장소 필요. KV / Upstash / DB 등

### 2026-05-26 — AI 응답 스키마와 내부 도메인 스키마는 분리하라

- **상황**: AnalysisResult에 `source: 'static' | 'ai'` 필드를 두고 zod로 검증하려 했음
- **문제**: AI는 `source` 같은 메타필드를 모르므로 응답에 채워주지 않음 → 검증 실패 → 폴백 무한 반복
- **원인**: 외부(AI)가 모르는 내부 도메인 개념을 외부 응답 스키마에 강제한 게 문제
- **해결**: 스키마를 2단으로 분리.
  - `AnalysisResultFromAISchema`: AI 응답 단계 (source 없음, fallback의 validate에서 사용)
  - `AnalysisResultSchema`: 후처리 후 (source 강제, 최종 응답 검증)
- **예방**: 외부 시스템의 응답 형식은 외부의 책임 범위만 강제. 내부 도메인 필드(source / 신뢰도 보정 / 출처 표시 등)는 후처리로 채운다.

### 2026-05-26 — readonly tuple vs mutable array 시그니처 충돌

- **상황**: `providers` 배열을 `as const`로 readonly tuple 선언 → withFallback에 전달
- **문제**: `AIProvider<T,U>[]` (mutable) 시그니처와 호환 안 됨 → TS2345
- **원인**: 함수 시그니처가 mutable을 요구하면 readonly를 못 받음
- **해결**: `withFallback`의 첫 인자를 `readonly AIProvider<T,U>[]`로 변경. 함수는 배열을 수정하지 않으므로 readonly 수용이 더 안전
- **예방**: 외부에서 받기만 하고 수정하지 않는 매개변수는 항상 `readonly`로 선언. 호출자의 `as const`나 frozen array를 자연스럽게 수용.

### 2026-05-26 — Vercel Functions는 Edge가 아닌 Node 런타임 선택

- **상황**: 콜드 스타트 감소를 위해 Edge runtime을 고려
- **문제**: OpenAI / Anthropic SDK는 Node-only 종속성 일부 사용 (Buffer / stream API). Edge에서 동작 안 됨
- **해결**: vercel.json에 `@vercel/node` runtime 명시. 콜드 스타트는 약간 늘지만 SDK 호환성 우선
- **예방**: Edge runtime 검토 전에 의존하는 SDK의 런타임 지원 매트릭스부터 확인. Web standard API만 쓰는 fetch 기반 라이브러리만 Edge 가능.

### 2026-05-26 — Rate limit 카운터를 fallback 내부에서 증가시키면 사용자 quota가 폭증

- **상황**: 처음엔 각 provider 호출 시점에 카운터를 INCR하려 함
- **문제**: 사용자 입장에서는 "분석 1회"인데 폴백으로 provider 2~3번 호출되면 quota가 2~3 소모됨. provider 실패가 사용자에게 손해
- **해결**: 요청 진입 시점(`analyze.ts`)에서 1회만 INCR. fallback 내부는 카운트 X. 응답 헤더 `X-RateLimit-Remaining`도 한 번만 갱신
- **예방**: 외부 한도(quota / 비용 / 알림)는 항상 **사용자가 인지하는 단위**에서만 카운트. 내부 재시도·폴백·자동 분기는 카운트 제외.

---

> 항목이 누적되면 카테고리별로 ## 섹션 분리.
