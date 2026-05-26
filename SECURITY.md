# SECURITY.md

> 본 프로젝트의 보안 금지/필수 패턴.

## 1. AI API 키 관리

### ❌ 절대 금지
```typescript
// src/lib/api.ts — 클라이언트 코드
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY; // ❌
```

이유: `VITE_*` 접두사 환경변수는 클라이언트 번들에 그대로 포함되어 누구나 DevTools로 볼 수 있음.

### ✅ 올바른 방식
- 키는 **Vercel Functions(`api/`)에서만** 사용
- 환경변수 이름은 `VITE_*` 접두사 없이 (예: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
- 로컬은 `.env.local` (gitignored), 배포는 Vercel 대시보드 환경변수

### 키 로깅
- 로그에 키 prefix만 마스킹 (`sk-***xxx`)
- 전체 키 로그 절대 금지

## 2. 입력 검증

### 클라이언트 + 서버 양쪽
| 항목 | 클라이언트 | 서버 (재검증) |
|---|---|---|
| 텍스트 길이 | 5000자 이하 | 5000자 초과 시 400 |
| 이미지 크기 | 5MB 이하 | 5MB 초과 시 400 |
| 이미지 MIME | `image/jpeg/png/webp` | 미지원 시 400 |
| 빈 입력 | 버튼 비활성 | 빈 본문 시 400 |

클라이언트 검증은 UX, 서버 검증은 보안. **둘 다 필수**.

## 3. Prompt Injection 대비

### 입력 위치
- 사용자 입력은 **`system` 메시지에 절대 포함 X**
- `user` 메시지에만 포함
- 명시적 구분자(`---`) 사용

### 휴리스틱 차단
다음 패턴을 사용자 입력에서 발견하면 거부:
- "ignore previous instructions"
- "이전 지시 무시"
- "system prompt"
- "당신은 이제부터"

매칭 시 분석 진행 없이 400 반환.

### Few-shot 위치
- Few-shot 예시는 **`system` 메시지에 포함** (사용자 입력과 분리)
- 사용자 입력이 few-shot의 형식을 모방해도 system 메시지가 명확히 분리되어 있어야 함

## 4. Rate Limiting (비용 보호)

본인 OpenAI/Claude 키 사용 시 비용 폭발 방지가 1차 목표.

| 항목 | 정책 |
|---|---|
| 한도 | IP당 일일 10회 (KST 자정 리셋) |
| 저장소 | Vercel KV (메모리 X — stateless 환경에서 무력) |
| 식별자 | `x-forwarded-for` 헤더 첫 IP |
| 카운트 시점 | 요청 진입 시 1회만 (폴백 다중 호출은 제외) |
| 초과 시 | HTTP 429 + `X-RateLimit-*` 헤더 + UX 안내 |
| 우회 환경변수 | `SKIP_RATE_LIMIT=1` (개발 전용, 프로덕션 자동 비활성) |
| KV 장애 시 | Fail-open (요청 통과 + `kv_failure: true` 로그) |

상세 명세: [SPEC.md §9](./SPEC.md)

## 5. XSS / 응답 렌더링

- AI 응답은 신뢰할 수 없는 텍스트로 취급
- `dangerouslySetInnerHTML` 사용 금지
- 모든 텍스트는 React JSX 텍스트 노드로 렌더 (자동 escape)
- AI 응답에 마크다운/링크가 있어도 plain text로만 표시

## 6. 환경변수

| 변수 | 위치 | 용도 |
|---|---|---|
| `OPENAI_API_KEY` | 서버 | OpenAI 호출 |
| `ANTHROPIC_API_KEY` | 서버 | Claude 호출 |
| `KV_REST_API_URL` | 서버 | Vercel KV 엔드포인트 |
| `KV_REST_API_TOKEN` | 서버 | Vercel KV 토큰 |
| `SKIP_RATE_LIMIT` | 서버 (개발) | rate limit 우회 (production 자동 무시) |

**`.env.local`은 절대 commit X.** `.env.sample`은 placeholder만 포함하고 commit 가능.

## 7. 응답 본문 노출

API 응답에 다음을 절대 포함 X:
- 키 원본 (마스킹된 prefix만 가능)
- 내부 스택 트레이스
- provider별 raw response (정제된 `AnalysisResult`만 노출)

## 8. CORS

본 프로젝트는 같은 origin(Vercel)에서만 호출되므로 CORS 헤더 설정 불필요.
외부 origin 허용은 명시적 의사결정 필요 (SPEC.md 갱신 후).
