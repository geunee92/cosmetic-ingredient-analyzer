# SPEC.md — 화장품 성분 분석기

> 본 문서는 구현 이전에 작성된 명세이며, 사전 논리 점검 체크리스트를 통과한 시점부터 구현을 시작한다.
> 각 커밋 메시지의 `Refs: SPEC.md §N` 으로 명세-구현 추적을 가능하게 한다.

---

## §1. 제품 개요

### 1.1 한 줄 정의
화장품 성분표(텍스트 또는 이미지)를 입력하면 각 성분의 **효능 · 주의사항 · 알레르기 가능성 · 국가별 규제 정보**를 AI로 분석해 카드 형태로 보여주는 **모바일 웹 분석 도구**.

### 1.2 타깃 사용자
- 화장품을 자주 사용하면서 본인 피부에 맞는 성분을 가볍게 확인하고 싶은 일반 소비자
- 해외 수출 화장품의 규제 차이(한국 vs 미국 MoCRA vs EU CPNP)를 빠르게 비교하고 싶은 산업 종사자 (참고용)

### 1.3 비-목표 (Non-Goals)
- **의료 진단 도구 아님** — 알레르기/피부 반응의 의학적 확정 진단 제공 X
- **전문가용 인허가 시스템 아님** — 정식 규제 컨설팅 도구 X
- **회원 / 기록 / 결제 X** — 단발성 분석만

### 1.4 가치 제안
- 화장품 라벨 글씨가 작아 읽기 어려운 사용자에게 **이미지 한 장**으로 즉시 분석 제공
- 같은 성분이라도 국가별 규제가 다른데, 이를 **한 화면에서 비교** 가능
- 정적 큐레이션 사전 + AI 하이브리드로 **AI 환각 위험 완화**

---

## §2. 사용자 흐름

### 2.1 메인 흐름 (텍스트)
1. 진입 → 모바일 프레임 단일 화면
2. 입력 토글에서 **텍스트** 선택 (기본값)
3. 성분표 텍스트 붙여넣기 (예: `Water, Glycerin, Niacinamide, ...`)
4. **분석** 버튼 탭 (잔여 횟수 1 이상일 때만 활성)
5. 로딩 (스피너 + 진행 상태 메시지)
6. 결과 카드 리스트 + (폴백 발생 시) 알림 배너 + 의료 disclaimer 표시
7. **다시 분석** 버튼으로 초기 상태로 복귀

### 2.2 이미지 흐름
1~2: 동일
3. 입력 토글에서 **이미지** 선택
4. 파일 선택(`<input capture="environment">`) 또는 드래그앤드롭
5. 이미지 미리보기 + 파일 정보 (이름/크기) 표시
6. **분석** 버튼 탭 (이미지 검증 통과 시 활성)
7~9: 동일 (단, 서버에서 OCR+분석을 OpenAI Vision으로 한 번에 처리)

### 2.3 오류 흐름
| 오류 | 분기 시점 | 표시 |
|---|---|---|
| 입력 비어있음 | 클라이언트 검증 | 인라인 메시지, 버튼 비활성 |
| 이미지 5MB 초과 / MIME 미지원 | 클라이언트 검증 | 인라인 메시지 |
| 텍스트 5000자 초과 | 클라이언트 검증 | 인라인 메시지 + 글자수 카운터 |
| 1차 provider 실패 + 2차 성공 | 서버 응답 후 | 결과 표시 + 폴백 배너 (회색, 비방해) |
| 모든 provider 실패 | 서버 응답 후 | 에러 카드 + 재시도 안내 |
| Rate limit 초과 | 서버 응답 후 (HTTP 429) | 에러 카드 + 리셋 시각(KST 자정) 안내 + 분석 버튼 비활성 |
| 인증 실패 (서버 키 잘못) | 서버 응답 후 (HTTP 500) | "일시적 문제, 잠시 후 다시" |

---

## §3. 화면 명세

### 3.1 레이아웃 원칙
- 단일 페이지 SPA (라우팅 없음)
- **모바일 프레임** — `max-width: 420px`, 좌우 16px 패딩
- PC에서 화면 가운데 정렬, 배경은 옅은 회색으로 모바일 프레임 시각화
- 다크모드 비지원 (Out of Scope)

### 3.2 영역 구성 (상단부터 하단)

```
┌─────────────────────────────────────┐
│ Header                              │
│   - 로고 / 앱 이름                   │
│   - 잔여 횟수 뱃지 (예: 8/10)        │
├─────────────────────────────────────┤
│ Input Section                       │
│   - 입력 타입 토글 [텍스트 | 이미지]  │
│   - 텍스트 영역 또는 이미지 업로드 영역 │
│   - 글자수 카운터 (텍스트일 때만)     │
│   - 분석 버튼                        │
│   - 인라인 에러 메시지                │
├─────────────────────────────────────┤
│ Loading (분석 중에만)                │
│   - 스피너                          │
│   - "AI가 성분을 분석 중입니다..."     │
├─────────────────────────────────────┤
│ Result Section (결과가 있을 때만)     │
│   - 폴백 배너 (폴백 발생 시에만)       │
│   - 성분 카드 리스트                  │
│   - 의료 Disclaimer                  │
│   - 다시 분석 버튼                    │
├─────────────────────────────────────┤
│ Error Section (에러 발생 시에만)       │
│   - 에러 메시지                       │
│   - 재시도 / 안내                     │
└─────────────────────────────────────┘
```

### 3.3 영역별 표시 규칙

#### 3.3.1 잔여 횟수 뱃지
- 형식: `8/10` (남은/전체)
- `0/10`일 때 뱃지 색상 빨강 + 분석 버튼 비활성
- 페이지 진입 시 한 번 조회 (`GET /api/quota` 또는 분석 응답 헤더에서 갱신)

#### 3.3.2 입력 타입 토글
- 두 개 버튼: `텍스트`, `이미지`
- 토글 전환 시 기존 입력 초기화 여부를 다이얼로그로 확인 (입력값이 있을 때만)

#### 3.3.3 텍스트 입력
- `<textarea>` — 최소 6줄, 최대 12줄 자동 확장
- placeholder: "Water, Glycerin, Niacinamide, ... 처럼 성분표를 붙여넣어주세요"
- 글자수 카운터: `0/5000` (5000 초과 시 빨강 + 분석 비활성)

#### 3.3.4 이미지 입력
- 드래그앤드롭 영역 + 파일 선택 버튼
- 파일 선택은 `<input type="file" accept="image/*" capture="environment">` (모바일에서 카메라 자동 트리거)
- 선택 후 미리보기 + 파일 정보 (이름/크기/MIME) 표시
- 검증: MIME `image/jpeg | image/png | image/webp`, 크기 ≤ 5MB

#### 3.3.5 분석 버튼
- 활성 조건: 입력 유효 + 잔여 횟수 ≥ 1 + 로딩 아님
- 활성 시 primary 색상, 비활성 시 회색

#### 3.3.6 폴백 배너
- 표시 조건: API 응답의 `usedProvider !== 'openai'` (즉 1차 폴백 발생)
- 색상: 회색 (방해 안 됨), 좌측 정보 아이콘
- 텍스트: `1차 분석 실패 → Claude로 분석 완료`
- 클릭 시 attempts 로그 펼침 (선택)

#### 3.3.7 성분 카드
```
┌─────────────────────────────────┐
│ Niacinamide  (나이아신아마이드)    │   ← 영문 INCI + 한글
│                                  │
│ 피지 조절 / 미백 효과              │   ← purpose
│                                  │
│ ⚠ 자극 가능  ⚠ 광민감              │   ← cautions 뱃지
│ 🌿 알레르기: 없음                  │   ← allergens
│                                  │
│ 🇰🇷 허용  🇺🇸 허용  🇪🇺 허용       │   ← regulations (한국/MoCRA/CPNP)
│                                  │
│ 출처: 정적 사전 · 신뢰도 95%       │   ← source + confidence
└─────────────────────────────────┘
```
- 카드는 세로 리스트, 카드 간격 12px
- 규제 상태별 색상: 허용 녹색, 제한 노랑, 금지 빨강, 불명 회색
- 출처 뱃지: `정적 사전` (회색) / `AI 분석` (보라)

#### 3.3.8 의료 Disclaimer
- 결과 영역 하단 항상 표시
- 회색 작은 글씨
- 텍스트: `본 분석은 일반 정보 제공용이며 의료 조언이 아닙니다. 알레르기 반응이나 피부 이상은 전문의와 상담하세요.`

#### 3.3.9 에러 카드
- 에러 종류별 메시지 (§2.3 표 참조)
- 재시도 버튼 (입력 보존)
- rate limit 초과 시 재시도 버튼 대신 "내일 KST 0시에 리셋됩니다"

### 3.4 접근성
- 모든 인터랙티브 요소 키보드 네비 가능 (`Tab`, `Enter`, `Space`)
- ARIA 라벨: 분석 버튼, 잔여 횟수 뱃지, 폴백 배너, 카드 뱃지
- 색상 대비 WCAG AA (특히 규제 뱃지 색상)
- 로딩 상태 `aria-live="polite"` 알림

---

## §4. API 명세

### 4.1 엔드포인트 목록
| Method | Path | 용도 |
|---|---|---|
| `POST` | `/api/analyze` | 성분 분석 (텍스트 또는 이미지) |
| `GET` | `/api/quota` | 잔여 호출 횟수 조회 (선택, 초기 진입 시) |

### 4.2 `POST /api/analyze`

#### 4.2.1 요청
```typescript
// Content-Type: application/json
type AnalyzeRequest =
  | { kind: 'text'; ingredients: string }              // 5000자 이하
  | { kind: 'image'; base64: string; mimeType: string }; // 5MB 이하 base64
```

#### 4.2.2 성공 응답 (200)
```typescript
type AnalyzeResponse = {
  schemaVersion: '1';
  result: AnalysisResult;          // §5 데이터 명세 참조
  usedProvider: 'openai' | 'claude';
  attempts: AttemptSummary[];       // 시도 로그 요약 (디버깅/UI)
};

type AttemptSummary = {
  provider: 'openai' | 'claude';
  status: 'success' | 'failed';
  errorType?: ErrorType;            // §5에 정의
  durationMs: number;
};
```

응답 헤더:
- `X-RateLimit-Limit: 10`
- `X-RateLimit-Remaining: <남은 횟수>`
- `X-RateLimit-Reset: <epoch sec, KST 자정>`

#### 4.2.3 에러 응답
| HTTP | 의미 | 본문 |
|---|---|---|
| 400 | 잘못된 입력 (빈 텍스트, 크기 초과, MIME 미지원) | `{ error: 'bad_request', message: string }` |
| 413 | 요청 본문 크기 초과 (Vercel 4.5MB 한도) | `{ error: 'payload_too_large', message: string }` |
| 429 | Rate limit 초과 | `{ error: 'rate_limit', message: string, resetAt: epoch }` + headers |
| 500 | 서버 키 인증 실패 (auth) | `{ error: 'auth', message: '일시적 문제' }` |
| 502 | 모든 provider 실패 | `{ error: 'all_providers_failed', message: string, attempts: AttemptSummary[] }` |
| 504 | 전체 타임아웃 (Vercel Functions 한도) | `{ error: 'timeout', message: string }` |

### 4.3 `GET /api/quota` (선택)
```typescript
type QuotaResponse = {
  limit: 10;
  remaining: number;
  resetAt: number;                  // epoch sec
};
```
응답 헤더 동일 (`X-RateLimit-*`).

### 4.4 인증
- 사용자 인증 없음
- 식별자는 `x-forwarded-for` 헤더의 첫 IP (Vercel이 자동 설정)
- API 키는 서버 환경변수에서만 접근 (클라이언트 노출 금지)

---

## §5. 데이터 명세

### 5.1 도메인 타입

```typescript
// 규제 적용 지역
type Region = 'KR' | 'US_MoCRA' | 'EU_CPNP';

// 규제 상태
type RegulationStatus =
  | 'allowed'      // 허용
  | 'restricted'   // 농도/조건부 허용
  | 'banned'       // 금지
  | 'unknown';     // 정보 부족

// 단일 규제 정보
type Regulation = {
  region: Region;
  status: RegulationStatus;
  note?: string;                    // 예: "0.5% 이하로만 허용"
};

// 성분 출처
type IngredientSource = 'static' | 'ai';  // 정적 사전 / AI 분석

// 단일 성분
type Ingredient = {
  name: string;                     // 영문 INCI 정식 표기
  koreanName?: string;              // 한글 명 (식약처 표기 우선)
  purpose: string;                  // 효능/역할 1~2줄
  cautions: string[];               // 주의사항 (자극, 광민감 등 키워드 1~3개)
  allergens: string[];              // 알레르기 유발 가능성 (EU 26 알러젠 기준)
  regulations: Regulation[];        // 3개 region 모두 포함 (없으면 unknown)
  confidence: number;               // 0~1
  source: IngredientSource;
};

// 전체 분석 결과
type AnalysisResult = {
  schemaVersion: '1';               // 향후 v2 도입 시 union 전환
  ingredients: Ingredient[];
  warnings?: string[];              // 제품 차원 경고 (예: "다수 자극 성분 포함")
  disclaimer: string;               // 의료 조언 아님 고지
};
```

### 5.2 에러 분류 타입

```typescript
type ErrorType =
  | 'network'           // 네트워크/5xx → 폴백
  | 'rate_limit'        // provider 429 → 폴백
  | 'timeout'           // 응답 지연 → 폴백
  | 'invalid_output'    // zod 검증 실패 → 폴백
  | 'content_filter'    // provider 안전 거부 → 폴백
  | 'auth'              // 401/403 → 즉시 throw (폴백 무의미)
  | 'bad_request'       // 400 → 즉시 throw (입력 문제)
  | 'unknown';          // 분류 불가 → 폴백 (보수적)
```

### 5.3 정규화 규칙

- `Ingredient.name` 정규화 함수 `normalizeIngredientName(s: string): string`
  - 소문자 변환
  - 양 끝 공백 제거
  - 연속 공백 1개로
  - 괄호 안 내용 제거 (예: `Tocopherol (Vitamin E)` → `tocopherol`)
- 사전 매칭은 이 정규화 결과로 비교

### 5.4 스키마 버전 관리
- 현재 `schemaVersion: '1'` (zod literal로 강제)
- v2 도입 시 `z.discriminatedUnion('schemaVersion', [v1Schema, v2Schema])`로 전환
- 마이그레이션 가이드는 v2 도입 시점에 SPEC v2로 별도 문서화

---

## §6. AI 프롬프트 명세

### 6.1 시스템 프롬프트 핵심 지시
```
당신은 화장품 성분 분석 전문가입니다. 사용자가 입력한 성분표를 분석해 JSON으로 응답해야 합니다.

규칙:
1. 응답은 반드시 지정된 JSON 스키마를 따르세요. 다른 텍스트 금지.
2. 성분명은 INCI(International Nomenclature of Cosmetic Ingredients) 정식 표기를 사용하세요.
3. 한글명이 있는 경우 식약처 고시 표기를 우선합니다.
4. 규제 정보는 한국(식약처), 미국 MoCRA, EU CPNP 세 지역 모두 포함하세요. 정보가 부족하면 status: "unknown".
5. cautions와 allergens는 짧은 키워드로 (1~3개). 긴 설명 금지.
6. 의학적 진단/처방 표현 금지. 일반 정보만 제공.
7. confidence는 본인의 답변 신뢰도(0~1). 잘 모르는 성분은 낮춰주세요.

이미지가 주어진 경우 OCR로 성분표를 먼저 추출한 뒤 분석하세요.
```

### 6.2 Few-Shot 예시 (3개)
프롬프트에 포함되는 예시는 자극/안전/저자극 균형:
- **자극 가능** 예시: `Fragrance` — 알레르기 유발 가능성 + EU CPNP 26 알러젠 표시 의무
- **안전** 예시: `Glycerin` — 광범위 허용, 보습
- **저자극 / 조건부** 예시: `Salicylic Acid` — 한국 0.5% 이하, EU CPNP 농도 제한, 영유아 금지

### 6.3 입력 형식

#### 6.3.1 텍스트 입력
```
[user message]
다음 성분표를 분석해주세요:

Water, Glycerin, Niacinamide, ...
```

#### 6.3.2 이미지 입력
```
[user message]
다음 이미지의 화장품 성분표를 OCR로 추출한 뒤 분석해주세요.

[image]
```

### 6.4 Provider별 출력 강제 방식
- **OpenAI**: `response_format: { type: 'json_object' }` 사용 + 시스템 프롬프트에 "JSON 응답" 명시
- **Claude**: Tool use API의 `tool_choice: { type: 'tool', name: 'analyze_ingredients' }`로 강제 + tool input schema에 zod 동일 구조

### 6.5 Prompt Injection 대비
- 사용자 입력은 system 메시지에 절대 포함 X
- user 메시지에만 포함하되, 명시적 구분자(`---`) 사용
- 사용자 입력에 "이전 지시 무시" 패턴 발견 시 거부 응답 (간단 휴리스틱)
- few-shot 예시는 system 메시지에 포함

### 6.6 모델 / 파라미터
| Provider | Model | Temperature | Max Tokens |
|---|---|---|---|
| OpenAI | `gpt-4o-mini` | 0.2 | 4000 |
| Claude | `claude-3-5-haiku-latest` 또는 `claude-3-5-sonnet-latest` | 0.2 | 4000 |

비용 우선이라 mini/haiku 클래스. 품질 부족 발견 시 LESSONS.md에 기록 후 상향.

---

## §7. 정적 규제 사전 명세

### 7.1 큐레이션 기준
다음 4가지 중 **하나 이상**에 해당하는 성분만 사전에 포함 (총 50개):
1. **국가별 규제가 명확히 다른** 성분 (예: 옥시벤존 — EU 제한, US 허용)
2. **EU CPNP 26 알러젠** 중 사용 빈도 높은 것 (예: Limonene, Linalool, Citronellol)
3. **식약처 고시 농도 제한** 성분 (예: Salicylic Acid, AHA 계열)
4. **FDA MoCRA 1B Annex 모니터링 대상** 성분 (예: Talc, PFAS)

### 7.2 데이터 출처 (README 참조)
- **한국**: 식품의약품안전처 — 「화장품법 시행규칙 별표 4 (사용한도 성분)」 / 화장품 안전기준 등에 관한 규정
- **미국**: FDA MoCRA (Modernization of Cosmetics Regulation Act of 2022) — 1B Annex
- **EU**: Regulation (EC) No 1223/2009 — Annex II (금지), III (제한), CosIng DB
- **알러젠**: SCCS Opinion on Fragrance Allergens (EU)

### 7.3 데이터 형식 (`src/data/regulations.ts`)
```typescript
type StaticIngredient = {
  inci: string;                     // 영문 INCI 정식 표기
  normalized: string;               // normalizeIngredientName 결과 (매칭 키)
  koreanName?: string;
  purpose: string;
  cautions: string[];
  allergens: string[];
  regulations: Regulation[];
  sources: string[];                // 참조 자료 URL/문서명
};

export const STATIC_INGREDIENTS: StaticIngredient[] = [
  // 50개 항목
];
```

### 7.4 매칭 로직 (서버 후처리)
1. AI가 응답한 `Ingredient[]` 받기
2. 각 ingredient의 name을 `normalizeIngredientName`으로 정규화
3. `STATIC_INGREDIENTS`에서 동일 normalized 값 검색
4. 매칭 시:
   - `regulations`, `cautions`, `allergens` 필드를 **정적 데이터로 덮어쓰기**
   - `purpose`는 AI 응답 유지 (도메인보다 자연어 설명 강점)
   - `source: 'static'`, `confidence: 1.0` 설정
5. 매칭 안 됨: `source: 'ai'` 유지, AI의 confidence 값 보존

### 7.5 사전 확장 정책
- v1: 50개 고정. 분량 부풀림 차단.
- 후속 확장은 별도 PR로 LESSONS.md 검토 후 진행.
- 100개 이상으로 늘어나면 `regulations.ts` 분할 (`regulations/kr.ts`, `eu.ts` 등) 결정.
