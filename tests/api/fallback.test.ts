/**
 * withFallback 폴백 시나리오 5종 검증.
 *
 * Refs: SPEC.md §5.2 에러 분류, §8 에러 케이스, 사전 점검 #3·#4
 */

import { describe, it, expect } from 'vitest';
import {
  withFallback,
  AllProvidersFailedError,
  NonFallbackableError,
} from '../../api/_lib/fallback';
import {
  makeSuccessProvider,
  makeFailingProvider,
  makeSlowProvider,
  makeInvalidOutputProvider,
} from './providers.mock';

const TEXT_INPUT = { kind: 'text' as const, ingredients: 'Water, Glycerin' };

describe('withFallback', () => {
  it('1차 provider 성공 시 2차를 호출하지 않는다', async () => {
    const primary = makeSuccessProvider('openai');
    const secondary = makeSuccessProvider('claude');

    const result = await withFallback([primary, secondary], TEXT_INPUT);

    expect(result.usedProvider).toBe('openai');
    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0].status).toBe('success');
    expect(result.result.echoed).toBe('Water, Glycerin');
  });

  it('1차 네트워크 실패 시 2차로 폴백한다', async () => {
    const primary = makeFailingProvider('openai', 'network');
    const secondary = makeSuccessProvider('claude');

    const result = await withFallback([primary, secondary], TEXT_INPUT);

    expect(result.usedProvider).toBe('claude');
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts[0].status).toBe('failed');
    expect(result.attempts[0].errorType).toBe('network');
    expect(result.attempts[1].status).toBe('success');
  });

  it('1차 bad_request 발생 시 즉시 throw하고 2차는 호출하지 않는다', async () => {
    const primary = makeFailingProvider('openai', 'bad_request', '입력이 너무 깁니다');
    const secondary = makeSuccessProvider('claude');

    await expect(withFallback([primary, secondary], TEXT_INPUT)).rejects.toBeInstanceOf(
      NonFallbackableError,
    );
  });

  it('모든 provider가 실패하면 AllProvidersFailedError를 throw한다', async () => {
    const primary = makeFailingProvider('openai', 'network');
    const secondary = makeFailingProvider('claude', 'rate_limit');

    try {
      await withFallback([primary, secondary], TEXT_INPUT);
      expect.fail('AllProvidersFailedError가 throw되지 않았다');
    } catch (err) {
      expect(err).toBeInstanceOf(AllProvidersFailedError);
      const attempts = (err as AllProvidersFailedError).attempts;
      expect(attempts).toHaveLength(2);
      expect(attempts[0].errorType).toBe('network');
      expect(attempts[1].errorType).toBe('rate_limit');
    }
  });

  it('타임아웃 초과 시 timeout 에러로 폴백한다', async () => {
    const primary = makeSlowProvider('openai', 500);
    const secondary = makeSuccessProvider('claude');

    const result = await withFallback([primary, secondary], TEXT_INPUT, { timeoutMs: 50 });

    expect(result.usedProvider).toBe('claude');
    expect(result.attempts[0].status).toBe('failed');
    expect(result.attempts[0].errorType).toBe('timeout');
  });

  it('validate 콜백이 false 반환 시 invalid_output으로 폴백한다', async () => {
    const primary = makeInvalidOutputProvider('openai');
    const secondary = makeSuccessProvider('claude');

    const result = await withFallback([primary, secondary], TEXT_INPUT, {
      validate: (out) => out.echoed !== '__INVALID__',
    });

    expect(result.usedProvider).toBe('claude');
    expect(result.attempts[0].status).toBe('failed');
    expect(result.attempts[0].errorType).toBe('invalid_output');
  });
});
