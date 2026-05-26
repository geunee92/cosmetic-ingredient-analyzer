/**
 * Provider 호출 시 발생할 수 있는 에러의 분류.
 *
 * 분류는 두 가지 정책에 영향:
 * 1. 폴백 트리거 여부 (`shouldFallback`)
 * 2. 클라이언트 응답의 HTTP 코드 (analyze.ts에서 매핑)
 *
 * 참조: SPEC.md §5.2 에러 분류, §8 에러 케이스, 사전 점검 #4
 */

export type ErrorType =
  /** 네트워크/5xx — provider 측 일시 장애. 다른 provider는 멀쩡할 수 있음 → 폴백 */
  | 'network'
  /** 429 — provider별 quota가 독립이므로 다른 provider로 폴백 */
  | 'rate_limit'
  /** 응답 지연 (15s 초과) — 사실상 장애 → 폴백 */
  | 'timeout'
  /** zod 스키마 미일치 / JSON parse 실패 — 다른 모델은 잘 줄 수 있음 → 폴백 */
  | 'invalid_output'
  /** Content filter (안전성 거부) — 모델별 정책 다름 → 폴백 */
  | 'content_filter'
  /** 401/403 — 키 잘못된 거. 다른 provider로 가도 같은 결과일 가능성 높지만,
   * 한 provider만 잘못 설정됐을 수 있어 다음 provider 시도는 의미가 있음.
   * 단, 모든 provider가 auth 실패면 500 응답. */
  | 'auth'
  /** 400 — 입력이 잘못된 거. 모든 provider가 못 푸므로 즉시 throw */
  | 'bad_request'
  /** 분류 불가 — 보수적으로 폴백 시도 */
  | 'unknown';

/**
 * provider 내부에서 throw하는 표준 에러.
 * fallback.ts에서 이 에러를 캐치해 분류한다.
 */
export class ProviderError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * 에러 타입이 폴백 트리거인지 판정.
 *
 * - 폴백 X: `bad_request` (사용자 입력 문제 — 어느 provider도 못 풀음)
 * - 폴백 O: 나머지 전부 (auth는 다른 provider가 정상일 수 있으므로 폴백)
 *
 * 참조: SPEC.md §5.2 에러 분류
 */
export const shouldFallback = (type: ErrorType): boolean => {
  return type !== 'bad_request';
};

/**
 * 알 수 없는 에러를 ProviderError로 정규화.
 * SDK가 던지는 다양한 에러 형식을 일관된 분류로 변환한다.
 *
 * 각 provider 어댑터에서 이 함수를 통해 정규화한 뒤 throw.
 */
export const normalizeError = (err: unknown, providerName: string): ProviderError => {
  if (err instanceof ProviderError) {
    return err;
  }

  const message = err instanceof Error ? err.message : String(err);

  // SDK별 휴리스틱 분류 (확장은 LESSONS.md에 기록 후)
  const lower = message.toLowerCase();

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return new ProviderError('timeout', `${providerName}: ${message}`, err);
  }
  if (lower.includes('401') || lower.includes('403') || lower.includes('unauthorized') || lower.includes('invalid api key')) {
    return new ProviderError('auth', `${providerName}: ${message}`, err);
  }
  if (lower.includes('429') || lower.includes('rate limit')) {
    return new ProviderError('rate_limit', `${providerName}: ${message}`, err);
  }
  if (lower.includes('content') && lower.includes('filter')) {
    return new ProviderError('content_filter', `${providerName}: ${message}`, err);
  }
  if (lower.includes('400') || lower.includes('bad request')) {
    return new ProviderError('bad_request', `${providerName}: ${message}`, err);
  }
  if (lower.includes('5') && (lower.includes('500') || lower.includes('502') || lower.includes('503') || lower.includes('504'))) {
    return new ProviderError('network', `${providerName}: ${message}`, err);
  }

  return new ProviderError('unknown', `${providerName}: ${message}`, err);
};
