/**
 * 테스트용 mock provider 팩토리.
 *
 * fallback.ts의 폴백/에러 분류 동작을 검증하기 위한 최소 구현.
 * 실제 OpenAI/Claude SDK 호출 없이 결정적 동작 시뮬레이션.
 */

import { type AIProvider, type ProviderName } from '../../api/_lib/providers/types';
import { ProviderError, type ErrorType } from '../../api/_lib/errors';

export type MockInput = { kind: 'text'; ingredients: string };
export type MockOutput = { providerName: ProviderName; echoed: string };

/**
 * 항상 성공하는 provider.
 */
export const makeSuccessProvider = (name: ProviderName): AIProvider<MockInput, MockOutput> => ({
  name,
  analyze: async (input) => ({ providerName: name, echoed: input.ingredients }),
});

/**
 * 항상 특정 ErrorType으로 실패하는 provider.
 */
export const makeFailingProvider = (
  name: ProviderName,
  errorType: ErrorType,
  message = `mocked ${errorType}`,
): AIProvider<MockInput, MockOutput> => ({
  name,
  analyze: async () => {
    throw new ProviderError(errorType, message);
  },
});

/**
 * 지정 ms 동안 멈춘 뒤 반환하는 provider (타임아웃 테스트용).
 */
export const makeSlowProvider = (
  name: ProviderName,
  delayMs: number,
): AIProvider<MockInput, MockOutput> => ({
  name,
  analyze: async (input) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return { providerName: name, echoed: input.ingredients };
  },
});

/**
 * 스키마 미일치 응답을 반환하는 provider (validate 콜백 테스트용).
 */
export const makeInvalidOutputProvider = (
  name: ProviderName,
): AIProvider<MockInput, MockOutput> => ({
  name,
  analyze: async () => ({ providerName: name, echoed: '__INVALID__' }),
});
