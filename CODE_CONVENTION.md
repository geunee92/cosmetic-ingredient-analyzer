# CODE_CONVENTION.md

> 본 프로젝트의 코드 작성 규칙. 신규 파일/기능은 이 컨벤션을 따른다.

## 폴더 구조

```
api/
├── analyze.ts                   # Vercel Function 진입점
└── _lib/                        # 비공개 헬퍼 (_ prefix로 라우팅 제외)
    ├── providers/
    │   ├── types.ts             # 인터페이스
    │   ├── openai.ts            # 구현체
    │   ├── claude.ts            # 구현체
    │   └── index.ts             # 배열 export
    ├── fallback.ts
    ├── prompt.ts
    ├── schema.ts
    ├── rateLimit.ts
    └── errors.ts

src/
├── main.tsx, App.tsx
├── styles/
│   ├── globals.ts
│   ├── theme.ts
│   └── mobileFrame.ts
├── components/
│   ├── base/                    # 원자 (Button, Spinner, Badge)
│   └── common/                  # 공용 (MobileFrame, Header, ErrorBoundary)
├── views/<domain>/              # 도메인 단위 (예: analyzer)
│   ├── <Domain>View.tsx         # View only
│   ├── hooks/                   # use<Domain>, useXxx
│   ├── components/              # 도메인 전용 컴포넌트
│   └── style.ts
├── store/                       # Zustand
├── lib/                         # API client, 포맷터
├── types/                       # 공유 도메인 타입
└── data/                        # 정적 데이터 (예: regulations.ts)
```

## 네이밍

| 대상 | 규칙 | 예 |
|---|---|---|
| 컴포넌트 파일/심볼 | `PascalCase` | `IngredientCard.tsx` |
| 훅 | `use<Domain>` camelCase | `useAnalyzer.ts` |
| 폴더 | camelCase | `analyzer/`, `components/` |
| 상수 | `SCREAMING_SNAKE_CASE` | `STATIC_INGREDIENTS` |
| boolean | `is/has/can` prefix | `isLoading`, `hasError` |
| 배열 | `<Item>List` suffix 또는 복수형 | `ingredientList`, `attempts` |
| API 핸들러 | `analyze.ts` (REST 경로와 동일) | `api/analyze.ts` |

## TypeScript

### type vs interface
- **항상 `type` alias 사용**. interface 금지 (확장보다 명시적 union/intersection이 의도 표현에 유리)
- 예외 없음

```typescript
// ✅
type Ingredient = { name: string; ... };

// ❌
interface Ingredient { name: string; ... }
```

### 제네릭
- 추상화의 명확한 이유가 있을 때만 사용 (YAGNI 우선)
- 사용 시 의도를 주석으로 명시

```typescript
// 향후 다른 도메인(예: 라벨 OCR)에도 폴백 패턴을 재사용하기 위해 제네릭
export interface AIProvider<TInput, TOutput> {
  readonly name: ProviderName;
  analyze(input: TInput): Promise<TOutput>;
}
```

### import 순서
1. Node/외부 패키지
2. `@/*` (절대 경로)
3. 상대 경로 (`./`, `../`)

각 그룹 사이 빈 줄.

## 컴포넌트 패턴

### View / Hook / Style 분리

```
components/IngredientCard/
├── IngredientCard.tsx       # View only
├── useIngredientCard.ts     # 로직 (있을 때만)
├── style.ts                 # emotion styled
└── index.ts                 # re-export
```

- `IngredientCard.tsx`는 **props를 받아 JSX 반환**만. 상태/이펙트 X
- 상태가 필요하면 `useIngredientCard.ts`로 분리
- 스타일은 `style.ts`로 분리. 컴포넌트 파일에 `styled` 사용 X

### 컴포넌트 선언

```typescript
// ✅
type Props = {
  ingredient: Ingredient;
  onRetry?: () => void;
};

export const IngredientCard = ({ ingredient, onRetry }: Props) => {
  return <Container>...</Container>;
};

// ❌
const IngredientCard: FC<Props> = (props) => { ... }
export default IngredientCard;
```

- `FC<Props>` 금지 (children 자동 포함 + 리턴 타입 추론 제한)
- `(props: Props) =>` 형태
- `export const` (Named Export) — 항상

## Zustand 패턴

```typescript
// store/analyzerStore.ts
type AnalyzerState = {
  status: 'idle' | 'loading' | 'done' | 'error';
  result: AnalysisResult | null;
  // ...
};

type AnalyzerActions = {
  startAnalysis: () => void;
  setResult: (result: AnalysisResult) => void;
  reset: () => void;
};

export const useAnalyzerStore = create<AnalyzerState & AnalyzerActions>((set) => ({
  status: 'idle',
  result: null,
  startAnalysis: () => set({ status: 'loading' }),
  setResult: (result) => set({ status: 'done', result }),
  reset: () => set({ status: 'idle', result: null }),
}));
```

- selector 사용으로 리렌더 최소화: `const status = useAnalyzerStore((s) => s.status)`
- 액션과 상태를 한 store에. slice 분리는 store 3개 이상일 때만

## emotion 패턴

### styled 분리

```typescript
// IngredientCard/style.ts
import styled from '@emotion/styled';

export const Container = styled.div`
  padding: 16px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.cardBg};
`;
```

### theme 사용

- 색/spacing/font 상수는 항상 `theme`에서 (`src/styles/theme.ts`)
- 컴포넌트에 하드코딩 금지

## API 클라이언트

`src/lib/api.ts` 단일 진입점. 다른 곳에서 직접 `fetch` 금지.

```typescript
// lib/api.ts
export const analyzeIngredients = async (req: AnalyzeRequest): Promise<AnalyzeResponse> => {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  // ...에러 분류 + 응답 헤더 처리
};
```

## 테스트 (Vitest)

### 파일 위치
- 모든 테스트는 `tests/` 하위
- 경로 구조는 source와 동일 (`api/_lib/fallback.ts` → `tests/api/fallback.test.ts`)

### 한글 describe/it

```typescript
import { describe, it, expect } from 'vitest';

describe('withFallback', () => {
  it('1차 provider 성공 시 2차를 호출하지 않는다', async () => {
    // ...
  });

  it('1차 네트워크 실패 시 2차로 폴백한다', async () => {
    // ...
  });
});
```

### 목 위치
- `tests/api/providers.mock.ts` 같이 `.mock.ts` 접미사
- 여러 테스트에서 공유

## SPEC 추적

데이터 구조/API/엣지 변경 시:
1. **먼저 SPEC.md 갱신**
2. 그 다음 코드 변경
3. 커밋 메시지 본문에 `Refs: SPEC.md §N`
