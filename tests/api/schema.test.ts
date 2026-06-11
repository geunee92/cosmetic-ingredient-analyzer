/**
 * AnalysisResult zod 스키마 검증 테스트.
 *
 * fallback의 validate 콜백에서 이 스키마가 invalid_output 폴백 트리거
 * 역할을 하므로 검증 누락 시 영향이 큼.
 *
 * Refs: SPEC.md §5 데이터 명세, §6 JSON 강제
 */

import { describe, it, expect } from 'vitest';
import { validateAnalysisResult, type AnalysisResult } from '../../api/_lib/schema';

const validResult: AnalysisResult = {
  schemaVersion: '1',
  ingredients: [
    {
      name: 'Niacinamide',
      koreanName: '나이아신아마이드',
      purpose: '피지 조절 / 미백 효과',
      cautions: ['자극 가능'],
      allergens: [],
      regulations: [
        { region: 'KR', status: 'allowed' },
        { region: 'US_MoCRA', status: 'allowed' },
        { region: 'EU_CPNP', status: 'allowed' },
      ],
      confidence: 0.95,
      source: 'static',
      tier: 'notable',
    },
  ],
  disclaimer: '본 분석은 의료 조언이 아닙니다.',
};

describe('validateAnalysisResult', () => {
  it('유효한 응답을 통과시킨다', () => {
    const result = validateAnalysisResult(validResult);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.ingredients).toHaveLength(1);
      expect(result.data.ingredients[0].name).toBe('Niacinamide');
    }
  });

  it('schemaVersion이 "1"이 아니면 거부한다', () => {
    const result = validateAnalysisResult({ ...validResult, schemaVersion: '2' });
    expect(result.ok).toBe(false);
  });

  it('disclaimer가 비어있으면 거부한다 (의료 disclaimer 강제)', () => {
    const result = validateAnalysisResult({ ...validResult, disclaimer: '' });
    expect(result.ok).toBe(false);
  });

  it('regulations의 region이 정의된 enum이 아니면 거부한다', () => {
    const broken = {
      ...validResult,
      ingredients: [
        {
          ...validResult.ingredients[0],
          regulations: [{ region: 'JP', status: 'allowed' }],
        },
      ],
    };
    const result = validateAnalysisResult(broken);
    expect(result.ok).toBe(false);
  });

  it('confidence가 0~1 범위 밖이면 거부한다', () => {
    const broken = {
      ...validResult,
      ingredients: [{ ...validResult.ingredients[0], confidence: 1.5 }],
    };
    const result = validateAnalysisResult(broken);
    expect(result.ok).toBe(false);
  });

  it('source가 static/ai 외 값이면 거부한다', () => {
    const broken = {
      ...validResult,
      ingredients: [{ ...validResult.ingredients[0], source: 'manual' }],
    };
    const result = validateAnalysisResult(broken);
    expect(result.ok).toBe(false);
  });

  it('ingredients가 비어있어도 통과한다 (성분 0개 분석 결과 허용)', () => {
    const empty = { ...validResult, ingredients: [] };
    const result = validateAnalysisResult(empty);
    expect(result.ok).toBe(true);
  });
});
