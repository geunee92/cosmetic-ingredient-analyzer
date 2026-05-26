/**
 * /api/analyze 클라이언트.
 *
 * 단일 진입점 — 다른 곳에서 직접 fetch 금지 (CODE_CONVENTION §API).
 *
 * 응답 헤더(X-RateLimit-*)를 함께 파싱해서 반환한다. 호출자가
 * Zustand store에 rate limit 상태를 갱신.
 */

import type { AnalysisResult } from '../../api/_lib/schema';
import type { AttemptInfo, ProviderName, RateLimitState, AnalyzerError } from '../store/analyzerStore';

export type AnalyzeRequest =
  | { kind: 'text'; ingredients: string }
  | { kind: 'image'; base64: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' };

export type AnalyzeSuccess = {
  schemaVersion: '1';
  result: AnalysisResult;
  usedProvider: ProviderName;
  attempts: AttemptInfo[];
};

export type AnalyzeResponse = {
  data: AnalyzeSuccess | null;
  error: AnalyzerError | null;
  rateLimit: RateLimitState | null;
};

const parseRateLimit = (headers: Headers): RateLimitState | null => {
  const limit = Number(headers.get('X-RateLimit-Limit'));
  const remaining = Number(headers.get('X-RateLimit-Remaining'));
  const resetAt = Number(headers.get('X-RateLimit-Reset'));
  if (!Number.isFinite(limit) || !Number.isFinite(remaining) || !Number.isFinite(resetAt)) {
    return null;
  }
  return { limit, remaining, resetAt };
};

const mapHttpToErrorCode = (status: number, body: { error?: string }): AnalyzerError['code'] => {
  if (status === 429) return 'rate_limit';
  if (status === 400) return 'bad_request';
  if (status === 502) return 'all_providers_failed';
  if (status === 500 && body.error === 'auth') return 'auth';
  if (status >= 500) return 'internal_error';
  return 'internal_error';
};

export const analyzeIngredients = async (req: AnalyzeRequest): Promise<AnalyzeResponse> => {
  let res: Response;
  try {
    res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '네트워크 오류';
    return {
      data: null,
      error: { code: 'network', message },
      rateLimit: null,
    };
  }

  const rateLimit = parseRateLimit(res.headers);

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return {
      data: null,
      error: { code: 'internal_error', message: '응답을 해석할 수 없습니다' },
      rateLimit,
    };
  }

  if (!res.ok) {
    const b = (body ?? {}) as { error?: string; message?: string; resetAt?: number };
    return {
      data: null,
      error: {
        code: mapHttpToErrorCode(res.status, b),
        message: b.message ?? '알 수 없는 오류',
        resetAt: b.resetAt,
      },
      rateLimit,
    };
  }

  return {
    data: body as AnalyzeSuccess,
    error: null,
    rateLimit,
  };
};
