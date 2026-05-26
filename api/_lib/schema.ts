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

export const IngredientSchema = z.object({
  name: z.string().min(1),
  koreanName: z.string().optional(),
  purpose: z.string().min(1),
  cautions: z.array(z.string()),
  allergens: z.array(z.string()),
  regulations: z.array(RegulationSchema),
  confidence: z.number().min(0).max(1),
  source: IngredientSourceSchema,
});

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
export type Ingredient = z.infer<typeof IngredientSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/**
 * AI 응답(unknown)을 검증해 AnalysisResult로 좁히거나 실패 정보를 반환.
 *
 * - 성공: { ok: true, data }
 * - 실패: { ok: false, issues } — fallback이 invalid_output으로 트리거
 */
type ZodIssue = z.ZodError['issues'][number];

export type ValidationResult =
  | { ok: true; data: AnalysisResult }
  | { ok: false; issues: ZodIssue[] };

export const validateAnalysisResult = (raw: unknown): ValidationResult => {
  const parsed = AnalysisResultSchema.safeParse(raw);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  return { ok: false, issues: parsed.error.issues };
};
