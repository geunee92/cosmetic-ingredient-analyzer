/**
 * 멀티 provider 폴백 오케스트레이션.
 *
 * 흐름:
 *   for each provider in order:
 *     try provider.analyze(input) (with timeout)
 *     if options.validate가 있고 결과가 false면 invalid_output 에러 처리
 *     성공 → 즉시 반환 (이후 provider 시도하지 않음)
 *     실패 → 에러 분류 → shouldFallback 판정
 *       - 폴백 X: 즉시 throw (auth/bad_request처럼 다음 시도가 무의미한 케이스)
 *       - 폴백 O: 다음 provider 시도
 *   모두 실패하면 AllProvidersFailedError throw
 *
 * 참조: SPEC.md §8 에러, §9 폴백 카운터 정책, 사전 점검 #3·#4
 */

import { type AIProvider, type ProviderName } from './providers/types';
import { ProviderError, type ErrorType, normalizeError, shouldFallback } from './errors';

export type AttemptLog = {
  provider: ProviderName;
  startedAt: number;
  durationMs: number;
  status: 'success' | 'failed';
  errorType?: ErrorType;
  errorMessage?: string;
};

export type FallbackResult<T> = {
  result: T;
  usedProvider: ProviderName;
  attempts: AttemptLog[];
};

export type FallbackOptions<TOutput> = {
  /**
   * provider 응답의 유효성 추가 검증 (예: zod 스키마).
   * false 반환 시 invalid_output 에러로 처리되어 다음 provider로 폴백.
   */
  validate?: (output: TOutput) => boolean;
  /**
   * provider별 호출 타임아웃 (ms). 기본 15초.
   * 폴백 트리거이므로 짧게 잡으면 빠르게 다음 provider로 넘어감.
   */
  timeoutMs?: number;
};

/**
 * 폴백 무중단 실패 시 throw. 호출자(analyze.ts)에서 502로 매핑.
 */
export class AllProvidersFailedError extends Error {
  constructor(public readonly attempts: AttemptLog[]) {
    super(`All providers failed (${attempts.length} attempts)`);
    this.name = 'AllProvidersFailedError';
  }
}

/**
 * 즉시 종료해야 하는 에러로 폴백을 중단하고 throw할 때 사용.
 * (bad_request처럼 다음 provider 시도가 무의미한 경우)
 */
export class NonFallbackableError extends Error {
  constructor(public readonly providerError: ProviderError, public readonly attempts: AttemptLog[]) {
    super(`Non-fallbackable error: ${providerError.type}`);
    this.name = 'NonFallbackableError';
  }
}

/**
 * Promise에 타임아웃을 강제하는 헬퍼.
 * 타임아웃 발생 시 ProviderError('timeout')으로 reject.
 */
const withTimeout = <T>(promise: Promise<T>, ms: number, providerName: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ProviderError('timeout', `${providerName}: timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
};

export const withFallback = async <TInput, TOutput>(
  providers: readonly AIProvider<TInput, TOutput>[],
  input: TInput,
  options: FallbackOptions<TOutput> = {},
): Promise<FallbackResult<TOutput>> => {
  if (providers.length === 0) {
    throw new Error('withFallback: providers must not be empty');
  }

  const timeoutMs = options.timeoutMs ?? 15_000;
  const attempts: AttemptLog[] = [];

  for (const provider of providers) {
    const startedAt = Date.now();

    try {
      const result = await withTimeout(provider.analyze(input), timeoutMs, provider.name);

      if (options.validate && !options.validate(result)) {
        throw new ProviderError('invalid_output', `${provider.name}: validation failed`);
      }

      attempts.push({
        provider: provider.name,
        startedAt,
        durationMs: Date.now() - startedAt,
        status: 'success',
      });

      return { result, usedProvider: provider.name, attempts };
    } catch (err) {
      const providerError = normalizeError(err, provider.name);

      attempts.push({
        provider: provider.name,
        startedAt,
        durationMs: Date.now() - startedAt,
        status: 'failed',
        errorType: providerError.type,
        errorMessage: providerError.message,
      });

      if (!shouldFallback(providerError.type)) {
        throw new NonFallbackableError(providerError, attempts);
      }

      // shouldFallback === true → 다음 provider 시도
      continue;
    }
  }

  throw new AllProvidersFailedError(attempts);
};
