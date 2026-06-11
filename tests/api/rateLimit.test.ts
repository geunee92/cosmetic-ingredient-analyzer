/**
 * Rate limit 동작 검증.
 *
 * @vercel/kv를 vi.mock으로 가짜 메모리 store로 교체해 INCR/EXPIRE
 * 동작을 결정적으로 테스트한다. KST 자정 리셋과 KV 장애 fail-open도 검증.
 *
 * Refs: SPEC.md §9, 사전 점검 #10·#11·#12·#13
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const kvStore = new Map<string, number>();
let kvFails = false;

vi.mock('@vercel/kv', () => ({
  kv: {
    incr: async (key: string) => {
      if (kvFails) throw new Error('KV down');
      const next = (kvStore.get(key) ?? 0) + 1;
      kvStore.set(key, next);
      return next;
    },
    expire: async (_key: string, _seconds: number) => {
      if (kvFails) throw new Error('KV down');
      return 1;
    },
  },
}));

// mock 적용 후 import
const { consumeQuota, todayKST, nextMidnightKST, DAILY_LIMIT } = await import(
  '../../api/_lib/rateLimit'
);

describe('rateLimit', () => {
  beforeEach(() => {
    kvStore.clear();
    kvFails = false;
    delete process.env.SKIP_RATE_LIMIT;
    delete process.env.VERCEL_ENV;
  });

  describe('todayKST', () => {
    it('UTC 환경에서 KST 기준 날짜를 반환한다', () => {
      // 2026-05-26 15:00 UTC → KST 2026-05-27 00:00 (자정 직후)
      const utc = new Date(Date.UTC(2026, 4, 26, 15, 0, 0));
      expect(todayKST(utc)).toBe('2026-05-27');
    });

    it('KST 자정 직전 (UTC 14:59)은 같은 날로 본다', () => {
      const utc = new Date(Date.UTC(2026, 4, 26, 14, 59, 0));
      expect(todayKST(utc)).toBe('2026-05-26');
    });
  });

  describe('nextMidnightKST', () => {
    it('KST 다음 자정의 epoch sec을 반환한다', () => {
      const utc = new Date(Date.UTC(2026, 4, 26, 5, 0, 0)); // KST 14:00
      const result = nextMidnightKST(utc);
      // KST 다음 자정 = 2026-05-27 00:00 KST = 2026-05-26 15:00 UTC
      const expected = Math.floor(Date.UTC(2026, 4, 26, 15, 0, 0) / 1000);
      expect(result).toBe(expected);
    });
  });

  describe('consumeQuota', () => {
    it('첫 호출은 통과하고 remaining이 DAILY_LIMIT-1이 된다', async () => {
      const result = await consumeQuota('1.2.3.4');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(DAILY_LIMIT - 1);
    });

    it('5회까지 통과하고 6회째에 차단된다', async () => {
      for (let i = 0; i < DAILY_LIMIT; i++) {
        const r = await consumeQuota('1.2.3.4');
        expect(r.allowed).toBe(true);
        expect(r.remaining).toBe(DAILY_LIMIT - 1 - i);
      }
      const blocked = await consumeQuota('1.2.3.4');
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it('다른 IP는 카운터가 독립이다', async () => {
      for (let i = 0; i < DAILY_LIMIT; i++) {
        await consumeQuota('1.2.3.4');
      }
      const otherIp = await consumeQuota('5.6.7.8');
      expect(otherIp.allowed).toBe(true);
      expect(otherIp.remaining).toBe(DAILY_LIMIT - 1);
    });

    it('KV 장애 시 fail-open으로 통과하고 kvFailure 플래그가 true', async () => {
      kvFails = true;
      const result = await consumeQuota('1.2.3.4');
      expect(result.allowed).toBe(true);
      expect(result.kvFailure).toBe(true);
    });

    it('SKIP_RATE_LIMIT=1이면 production이 아닐 때 우회한다', async () => {
      process.env.SKIP_RATE_LIMIT = '1';
      process.env.VERCEL_ENV = 'development';
      for (let i = 0; i < 50; i++) {
        const r = await consumeQuota('1.2.3.4');
        expect(r.allowed).toBe(true);
        expect(r.remaining).toBe(DAILY_LIMIT);
      }
    });

    it('SKIP_RATE_LIMIT=1이라도 production 환경에서는 무시되어 정상 카운트된다', async () => {
      process.env.SKIP_RATE_LIMIT = '1';
      process.env.VERCEL_ENV = 'production';
      const r = await consumeQuota('1.2.3.4');
      expect(r.remaining).toBe(DAILY_LIMIT - 1);
    });
  });
});
