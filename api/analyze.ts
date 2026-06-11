/**
 * POST /api/analyze — 화장품 성분 분석 진입점.
 *
 * 흐름:
 *   1. 메소드/Content-Type 검증
 *   2. 입력 검증 (텍스트 5000자 / 이미지 5MB / MIME)
 *   3. Prompt Injection 휴리스틱 검사
 *   4. Rate limit (IP 일일 10회) — 진입 시 1회만 INCR
 *   5. withFallback(providers, input, { validate: zod })
 *   6. 성공 → 200 + AnalysisResult + usedProvider + attempts
 *   7. NonFallbackable / AllProvidersFailed / Error → 적절한 HTTP 코드
 *
 * Refs: SPEC.md §4 API 명세, §8 에러 케이스
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { providers } from './_lib/providers/index';
import type { AnalyzeInput } from './_lib/providers/types';
import {
  withFallback,
  AllProvidersFailedError,
  NonFallbackableError,
} from './_lib/fallback';
import { validateAnalysisResult, validateAnalysisResultFromAI } from './_lib/schema';
import { postProcessAnalysisResult } from './_lib/postProcess';
import { hasPromptInjection } from './_lib/prompt';
import { consumeQuota, buildRateLimitHeaders } from './_lib/rateLimit';

const MAX_TEXT_LENGTH = 5000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

type ErrorBody = { error: string; message: string; [extra: string]: unknown };

const sendError = (
  res: VercelResponse,
  status: number,
  error: string,
  message: string,
  extra: Record<string, unknown> = {},
): void => {
  const body: ErrorBody = { error, message, ...extra };
  res.status(status).json(body);
};

const getClientIp = (req: VercelRequest): string => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  if (Array.isArray(xff) && xff.length > 0) return xff[0].split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
};

const validateInput = (body: unknown): { ok: true; input: AnalyzeInput } | { ok: false; message: string } => {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: '본문이 비어있거나 객체가 아닙니다' };
  }
  const b = body as Record<string, unknown>;

  if (b.kind === 'text') {
    if (typeof b.ingredients !== 'string' || b.ingredients.trim().length === 0) {
      return { ok: false, message: 'ingredients가 비어있습니다' };
    }
    if (b.ingredients.length > MAX_TEXT_LENGTH) {
      return { ok: false, message: `텍스트는 ${MAX_TEXT_LENGTH}자 이하여야 합니다` };
    }
    return { ok: true, input: { kind: 'text', ingredients: b.ingredients } };
  }

  if (b.kind === 'image') {
    if (typeof b.base64 !== 'string' || typeof b.mimeType !== 'string') {
      return { ok: false, message: 'base64 / mimeType이 필요합니다' };
    }
    if (!ALLOWED_MIME.includes(b.mimeType as (typeof ALLOWED_MIME)[number])) {
      return { ok: false, message: `지원하지 않는 MIME 타입: ${b.mimeType}` };
    }
    // base64 길이로 대략 바이트 크기 추정 (실제는 base64 길이 * 3/4)
    const approxBytes = Math.floor((b.base64.length * 3) / 4);
    if (approxBytes > MAX_IMAGE_BYTES) {
      return { ok: false, message: `이미지는 5MB 이하여야 합니다` };
    }
    return {
      ok: true,
      input: { kind: 'image', base64: b.base64, mimeType: b.mimeType as 'image/jpeg' | 'image/png' | 'image/webp' },
    };
  }

  return { ok: false, message: 'kind는 "text" 또는 "image"여야 합니다' };
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'method_not_allowed', 'POST만 허용됩니다');
  }

  // 1. 입력 검증
  const validation = validateInput(req.body);
  if (!validation.ok) {
    return sendError(res, 400, 'bad_request', validation.message);
  }
  const input = validation.input;

  // 2. Prompt Injection 휴리스틱
  if (input.kind === 'text' && hasPromptInjection(input.ingredients)) {
    return sendError(res, 400, 'bad_request', '허용되지 않은 입력 패턴이 감지되었습니다');
  }

  // 3. Rate limit (진입 시 1회만 INCR)
  const ip = getClientIp(req);
  const quota = await consumeQuota(ip);
  const rateHeaders = buildRateLimitHeaders(quota);
  Object.entries(rateHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (!quota.allowed) {
    return sendError(res, 429, 'rate_limit', '오늘 분석 횟수를 모두 사용했습니다', {
      resetAt: quota.resetAt,
    });
  }

  // 4. 멀티 폴백 실행 + AI 응답 검증 (source 없는 FromAI 스키마)
  try {
    const fallbackResult = await withFallback(providers, input, {
      validate: (raw) => validateAnalysisResultFromAI(raw).ok,
      timeoutMs: 45_000,
    });

    // validate를 통과했으므로 안전하게 재검증해 정형화
    const validated = validateAnalysisResultFromAI(fallbackResult.result);
    if (!validated.ok) {
      // 이론적으로 발생 안 함 (이미 validate 통과). 방어용
      return sendError(res, 502, 'invalid_output', 'AI 응답 검증 실패');
    }

    // 5. 사전 기반 후처리 (source 채움 + 규제 정합)
    const processed = postProcessAnalysisResult(validated.data);

    // 6. 후처리 후 최종 검증 (source 포함)
    const finalValidated = validateAnalysisResult(processed);
    if (!finalValidated.ok) {
      return sendError(res, 502, 'invalid_output', '후처리 응답 검증 실패');
    }

    res.status(200).json({
      schemaVersion: '1' as const,
      result: finalValidated.data,
      usedProvider: fallbackResult.usedProvider,
      attempts: fallbackResult.attempts.map((a) => ({
        provider: a.provider,
        status: a.status,
        errorType: a.errorType,
        durationMs: a.durationMs,
      })),
    });
  } catch (err) {
    if (err instanceof NonFallbackableError) {
      // bad_request는 400, auth는 500으로 매핑
      const status = err.providerError.type === 'bad_request' ? 400 : 500;
      return sendError(res, status, err.providerError.type, err.providerError.message, {
        attempts: err.attempts,
      });
    }
    if (err instanceof AllProvidersFailedError) {
      return sendError(res, 502, 'all_providers_failed', '모든 AI provider 호출 실패', {
        attempts: err.attempts,
      });
    }
    const message = err instanceof Error ? err.message : String(err);
    return sendError(res, 500, 'internal_error', message);
  }
}
