/**
 * postProcessAnalysisResult — 정적 사전 매칭 후처리 검증.
 *
 * Refs: SPEC.md §7.4 매칭 로직
 */

import { describe, it, expect } from 'vitest';
import { postProcessAnalysisResult } from '../../api/_lib/postProcess';
import type { AnalysisResultFromAI } from '../../api/_lib/schema';

const baseAiResponse = (overrides: Partial<AnalysisResultFromAI['ingredients'][number]>): AnalysisResultFromAI => ({
  schemaVersion: '1',
  ingredients: [
    {
      name: 'Niacinamide',
      koreanName: 'AI 임시 한글명',
      purpose: 'AI가 설명한 효능',
      cautions: ['AI 임시 주의'],
      allergens: ['AI 임시 알러젠'],
      regulations: [{ region: 'KR', status: 'unknown' }],
      confidence: 0.6,
      ...overrides,
    },
  ],
  disclaimer: '본 분석은 의료 조언이 아닙니다.',
});

describe('postProcessAnalysisResult', () => {
  it('사전 매칭 시 regulations / cautions / allergens를 정적 데이터로 덮어쓴다', () => {
    const ai = baseAiResponse({});
    const result = postProcessAnalysisResult(ai);

    const ing = result.ingredients[0];
    expect(ing.source).toBe('static');
    expect(ing.confidence).toBe(1.0);
    // 사전의 Niacinamide는 cautions/allergens가 비어있음
    expect(ing.cautions).toEqual([]);
    expect(ing.allergens).toEqual([]);
    // regulations는 3개 region 모두 포함
    expect(ing.regulations).toHaveLength(3);
    expect(ing.regulations.map((r) => r.region).sort()).toEqual(['EU_CPNP', 'KR', 'US_MoCRA']);
  });

  it('사전 매칭 시에도 purpose(효능)는 AI 응답을 유지한다', () => {
    const ai = baseAiResponse({ purpose: 'AI가 설명한 효능' });
    const result = postProcessAnalysisResult(ai);

    expect(result.ingredients[0].purpose).toBe('AI가 설명한 효능');
  });

  it('사전 매칭 시 한글명은 사전 우선', () => {
    const ai = baseAiResponse({ koreanName: 'AI 임시 한글명' });
    const result = postProcessAnalysisResult(ai);

    expect(result.ingredients[0].koreanName).toBe('나이아신아마이드');
  });

  it('사전에 없는 성분은 AI 응답 그대로 + source="ai"', () => {
    const ai = baseAiResponse({
      name: 'Unknown Made Up Ingredient',
      cautions: ['AI 추정 주의'],
      confidence: 0.5,
    });
    const result = postProcessAnalysisResult(ai);

    const ing = result.ingredients[0];
    expect(ing.source).toBe('ai');
    expect(ing.name).toBe('Unknown Made Up Ingredient');
    expect(ing.cautions).toEqual(['AI 추정 주의']);
    expect(ing.confidence).toBe(0.5);
  });

  it('이름 정규화로 대소문자/공백/괄호 차이를 흡수해 매칭한다', () => {
    const ai = baseAiResponse({ name: '  TOCOPHEROL  (Vitamin E)' });
    const result = postProcessAnalysisResult(ai);

    // 사전에 'tocopherol'로 등록되어 있어 매칭되어야 함
    expect(result.ingredients[0].source).toBe('static');
    expect(result.ingredients[0].koreanName).toBe('토코페롤 (비타민 E)');
  });

  it('여러 성분 중 일부만 매칭되어도 각각 다른 source가 부여된다', () => {
    const ai: AnalysisResultFromAI = {
      schemaVersion: '1',
      ingredients: [
        {
          name: 'Glycerin',
          purpose: '보습',
          cautions: [],
          allergens: [],
          regulations: [],
          confidence: 0.9,
        },
        {
          name: 'Imaginary Extract',
          purpose: 'AI가 만들어낸 성분',
          cautions: [],
          allergens: [],
          regulations: [],
          confidence: 0.3,
        },
      ],
      disclaimer: '본 분석은 의료 조언이 아닙니다.',
    };

    const result = postProcessAnalysisResult(ai);

    expect(result.ingredients[0].source).toBe('static');
    expect(result.ingredients[1].source).toBe('ai');
  });

  it('disclaimer / warnings / schemaVersion은 그대로 보존된다', () => {
    const ai = baseAiResponse({});
    ai.warnings = ['전체 제품 차원 경고'];
    const result = postProcessAnalysisResult(ai);

    expect(result.schemaVersion).toBe('1');
    expect(result.disclaimer).toBe(ai.disclaimer);
    expect(result.warnings).toEqual(['전체 제품 차원 경고']);
  });
});
