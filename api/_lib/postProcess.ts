/**
 * AI 응답 후처리 — 정적 사전 기반 정합.
 *
 * AI는 INCI 이름과 효능을 잘 설명하지만 국가별 규제는 환각 위험이 크다.
 * 사전 매칭된 성분은 regulations/cautions/allergens를 정적 데이터로
 * 덮어쓰고, source='static' + confidence=1.0으로 표시한다.
 *
 * 사전에 없는 성분은 AI 응답을 보존하되 source='ai'로 표시 →
 * UI에서 사용자에게 출처를 투명하게 노출.
 *
 * Refs: SPEC.md §7.4 매칭 로직
 */

import type { AnalysisResultFromAI, AnalysisResult, Ingredient } from './schema';
import { findStaticIngredient } from '../../src/data/regulations';

export const postProcessAnalysisResult = (raw: AnalysisResultFromAI): AnalysisResult => {
  const ingredients: Ingredient[] = raw.ingredients.map((ai) => {
    const staticMatch = findStaticIngredient(ai.name);

    if (staticMatch) {
      // 정적 사전 매칭: 규제 / 주의 / 알러젠은 사전 우선
      // 효능(purpose)은 AI 응답 유지 (도메인 사실보다 자연어 설명이 강점)
      return {
        name: ai.name,
        koreanName: staticMatch.koreanName ?? ai.koreanName,
        purpose: ai.purpose,
        cautions: staticMatch.cautions,
        allergens: staticMatch.allergens,
        regulations: staticMatch.regulations,
        confidence: 1.0,
        source: 'static',
      };
    }

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
