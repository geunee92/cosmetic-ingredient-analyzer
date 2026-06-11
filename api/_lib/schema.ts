/**
 * AnalysisResult zod 스키마 + 검증.
 *
 * AI 응답(JSON)을 받아 zod로 검증한다. 검증 실패는 fallback의
 * invalid_output 폴백 트리거가 되어 다른 provider로 자동 전환된다.
 *
 * schemaVersion: 향후 v2 도입 시 z.discriminatedUnion('schemaVersion', ...)으로 전환.
 *
 * Refs: SPEC.md §5 데이터 명세, §6 AI 프롬프트 (JSON 강제), 사전 점검 #9
 */

import { z } from 'zod';

export const RegionSchema = z.enum(['KR', 'US_MoCRA', 'EU_CPNP']);

export const RegulationStatusSchema = z.enum(['allowed', 'restricted', 'banned', 'unknown']);

export const RegulationSchema = z.object({
  region: RegionSchema,
  status: RegulationStatusSchema,
  note: z.string().optional(),
});

export const IngredientSourceSchema = z.enum(['static', 'ai']);

/**
 * 성분 중요도 (§12).
 * - safe: AI가 규제·주의 무관으로 판단 → 간단 출력(상세 필드 생략)
 * - notable: 규제·주의·알러젠 가능성 → 풀 상세 출력
 */
export const IngredientTierSchema = z.enum(['safe', 'notable']);

/**
 * AI에게 직접 받는 ingredient (§12). source는 후처리에서 채우므로 제외.
 *
 * 단일 호출에서 AI가 성분별로 tier를 판단해 가변 출력한다:
 *  - tier='safe'  → name/koreanName/purpose/tier 만 (상세 필드 생략 → 출력 경량화)
 *  - tier='notable' → cautions/allergens/regulations/confidence까지 풀 상세
 * 따라서 상세 필드는 optional. notable인데 누락되면 후처리에서 기본값 보정.
 */
export const IngredientFromAISchema = z.object({
  name: z.string().min(1),
  koreanName: z.string().optional(),
  purpose: z.string().min(1),
  tier: IngredientTierSchema,
  cautions: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  regulations: z.array(RegulationSchema).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

/**
 * 후처리 후 클라이언트에 노출하는 ingredient. source가 강제됨.
 *
 * tier='safe'(2차 미경유)는 regulations/cautions/allergens가 비어있을 수 있어
 * 해당 필드를 optional로 완화한다. notable은 2차 풀 분석이라 항상 채워진다.
 */
export const IngredientSchema = z.object({
  name: z.string().min(1),
  koreanName: z.string().optional(),
  purpose: z.string().min(1),
  cautions: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  regulations: z.array(RegulationSchema).optional(),
  confidence: z.number().min(0).max(1).optional(),
  source: IngredientSourceSchema,
  tier: IngredientTierSchema,
});

/**
 * AI 응답 단계 — fallback의 validate 콜백에서 사용.
 */
export const AnalysisResultFromAISchema = z.object({
  schemaVersion: z.literal('1'),
  ingredients: z.array(IngredientFromAISchema),
  warnings: z.array(z.string()).optional(),
  disclaimer: z.string().min(1),
});

/**
 * 후처리 후 최종 응답 — analyze.ts에서 클라이언트 응답 직전 검증.
 */
export const AnalysisResultSchema = z.object({
  schemaVersion: z.literal('1'),
  ingredients: z.array(IngredientSchema),
  warnings: z.array(z.string()).optional(),
  disclaimer: z.string().min(1),
});

export type Region = z.infer<typeof RegionSchema>;
export type RegulationStatus = z.infer<typeof RegulationStatusSchema>;
export type Regulation = z.infer<typeof RegulationSchema>;
export type IngredientSource = z.infer<typeof IngredientSourceSchema>;
export type IngredientTier = z.infer<typeof IngredientTierSchema>;
export type IngredientFromAI = z.infer<typeof IngredientFromAISchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;
export type AnalysisResultFromAI = z.infer<typeof AnalysisResultFromAISchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/**
 * AI 응답(unknown)을 검증해 AnalysisResult로 좁히거나 실패 정보를 반환.
 *
 * - 성공: { ok: true, data }
 * - 실패: { ok: false, issues } — fallback이 invalid_output으로 트리거
 */
type ZodIssue = z.ZodError['issues'][number];

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; issues: ZodIssue[] };

/**
 * AI 응답 검증 (fallback의 validate 콜백용). source 필드 없이도 통과.
 */
export const validateAnalysisResultFromAI = (raw: unknown): ValidationResult<AnalysisResultFromAI> => {
  const parsed = AnalysisResultFromAISchema.safeParse(raw);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  return { ok: false, issues: parsed.error.issues };
};

/**
 * 후처리 후 최종 응답 검증 (analyze.ts에서 클라이언트 응답 직전).
 */
export const validateAnalysisResult = (raw: unknown): ValidationResult<AnalysisResult> => {
  const parsed = AnalysisResultSchema.safeParse(raw);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  return { ok: false, issues: parsed.error.issues };
};
