/**
 * AI 응답 후처리 — 정적 사전 기반 정합 + 안전망 (§12.4).
 *
 * AI는 INCI 이름과 효능을 잘 설명하지만 국가별 규제는 환각 위험이 크다.
 * 사전 매칭된 성분(위험성분)은 regulations/cautions/allergens를 정적 데이터로
 * 덮어쓰고, source='static'으로 표시한다. 또한 AI가 'safe'로 잘못 분류했더라도
 * 사전에 있는 위험성분이면 tier='notable'로 강제 승격한다(안전망).
 *
 * 사전에 없는 성분은 AI 응답(tier 포함)을 그대로 보존, source='ai'.
 *
 * Refs: SPEC.md §7.4, §12.4 안전망
 */

import type { AnalysisResultFromAI, AnalysisResult, Ingredient } from './schema';
import { findStaticIngredient } from './regulations';

export const postProcessAnalysisResult = (raw: AnalysisResultFromAI): AnalysisResult => {
  const ingredients: Ingredient[] = raw.ingredients.map((ai) => {
    const staticMatch = findStaticIngredient(ai.name);

    if (staticMatch) {
      // 정적 사전 매칭(위험성분): 규제/주의/알러젠 사전 우선 + notable 강제 승격(안전망).
      // 효능(purpose)은 AI 응답 유지 (도메인 사실보다 자연어 설명이 강점).
      return {
        name: ai.name,
        koreanName: staticMatch.koreanName ?? ai.koreanName,
        purpose: ai.purpose,
        cautions: staticMatch.cautions,
        allergens: staticMatch.allergens,
        regulations: staticMatch.regulations,
        confidence: 1.0,
        source: 'static',
        tier: 'notable',
      };
    }

    // 미매칭: AI 응답 그대로(tier·상세 필드 보존). safe는 상세 필드가 없을 수 있음.
    return {
      ...ai,
      source: 'ai',
    };
  });

  return {
    schemaVersion: raw.schemaVersion,
    ingredients,
    warnings: raw.warnings,
    disclaimer: raw.disclaimer,
  };
};
