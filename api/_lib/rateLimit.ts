/**
 * IP 기반 일일 rate limit (Vercel KV).
 *
 * 본인 OpenAI/Anthropic 키의 비용 폭발 방지를 1차 목표로 한다.
 *
 * 정책:
 *   - IP당 일일 10회 (KST 자정 리셋)
 *   - 키 형식: rate:<ip>:<YYYY-MM-DD-KST>
 *   - INCR + EXPIRE 원자 연산
 *   - 메모리 기반은 stateless 환경에서 무력하므로 KV 필수
 *   - KV 장애 시 fail-open (요청 통과 + kv_failure 로그)
 *   - 카운트 시점: 요청 진입 시 1회만 (폴백 다중 호출 제외)
 *
 * Refs: SPEC.md §9 Rate Limiting, SECURITY.md §4
 */

import { kv } from '@vercel/kv';

export const DAILY_LIMIT = 10;

export type QuotaResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch sec, 다음 KST 자정
  kvFailure?: boolean; // KV 장애로 fail-open한 경우 true (로그용)
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * KST 기준 오늘 날짜를 'YYYY-MM-DD' 형식으로 반환.
 * Vercel Functions는 UTC라 직접 변환 필요.
 */
export const todayKST = (now: Date = new Date()): string => {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * 다음 KST 자정 epoch sec.
 */
export const nextMidnightKST = (now: Date = new Date()): number => {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  // KST의 다음 자정을 만들고 UTC로 되돌림
  const nextKst = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + 1, 0, 0, 0));
  return Math.floor((nextKst.getTime() - KST_OFFSET_MS) / 1000);
};

const buildKey = (ip: string, date: string): string => `rate:${ip}:${date}`;

/**
 * 호출 시점에 카운터를 1 증가시키고 결과 반환.
 *
 * - count <= DAILY_LIMIT: 통과
 * - count > DAILY_LIMIT: 차단 (HTTP 429)
 * - KV 장애: fail-open (통과 + kvFailure 플래그)
 *
 * 개발 우회: SKIP_RATE_LIMIT=1 (단, production 환경에서는 무시).
 */
export const consumeQuota = async (ip: string, now: Date = new Date()): Promise<QuotaResult> => {
  const resetAt = nextMidnightKST(now);

  // 개발 우회 (production 자동 비활성)
  if (process.env.SKIP_RATE_LIMIT === '1' && process.env.VERCEL_ENV !== 'production') {
    return { allowed: true, remaining: DAILY_LIMIT, resetAt };
  }

  const key = buildKey(ip, todayKST(now));

  try {
    const count = await kv.incr(key);
    if (count === 1) {
      // 안전 마진 60초 추가
      await kv.expire(key, 24 * 60 * 60 + 60);
    }
    if (count > DAILY_LIMIT) {
      return { allowed: false, remaining: 0, resetAt };
    }
    return { allowed: true, remaining: DAILY_LIMIT - count, resetAt };
  } catch (err) {
    // KV 장애 시 fail-open: 요청은 통과시키되 로그 + 호출자가 헤더에 표시 가능
    console.error('rate_limit:kv_failure', err);
    return { allowed: true, remaining: DAILY_LIMIT, resetAt, kvFailure: true };
  }
};

/**
 * HTTP 응답 헤더용 객체 변환.
 */
export const buildRateLimitHeaders = (quota: QuotaResult): Record<string, string> => ({
  'X-RateLimit-Limit': String(DAILY_LIMIT),
  'X-RateLimit-Remaining': String(quota.remaining),
  'X-RateLimit-Reset': String(quota.resetAt),
});
