/**
 * 정적 규제 사전 (v1: 50개).
 *
 * AI 응답을 신뢰하기 어려운 영역(국가별 규제 / 알러젠) 위주로 큐레이션.
 * AI가 응답한 동일 normalized 이름이 있으면 정적 데이터로 덮어쓴다.
 *
 * 큐레이션 기준 (SPEC §7.1):
 *   1. 국가별 규제가 명확히 다른 성분
 *   2. EU CPNP 26 알러젠 중 빈도 높은 것
 *   3. 식약처 고시 농도 제한 성분
 *   4. FDA MoCRA Annex 모니터링 대상
 *
 * 주의: v1은 일반 자료 기반 초안. 정식 서비스 출시 전 식약처/CosIng DB
 * 교차 검증 필요. 출처 컬럼은 카테고리 수준만 표기.
 *
 * Refs: SPEC.md §7 정적 규제 사전
 */

import type { Regulation } from './schema';

export type StaticIngredient = {
  inci: string;
  normalized: string; // normalizeIngredientName 결과 (매칭 키)
  koreanName?: string;
  purpose: string;
  cautions: string[];
  allergens: string[];
  regulations: Regulation[];
  sources: string[]; // 카테고리 표기 (예: '식약처 화장품법', 'EU CosIng', 'FDA MoCRA')
};

const SOURCES_ALL = ['식약처 화장품법', 'EU CosIng / Regulation 1223/2009', 'FDA MoCRA'];

export const STATIC_INGREDIENTS: StaticIngredient[] = [
  // ─── 자외선 차단 ───
  {
    inci: 'Oxybenzone',
    normalized: 'oxybenzone',
    koreanName: '옥시벤존',
    purpose: '자외선 차단제 (UVA/UVB)',
    cautions: ['호르몬 교란 우려', '광민감'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '5% 이하' },
      { region: 'US_MoCRA', status: 'allowed', note: '하와이 등 일부 주 산호초 보호 목적 사용 제한' },
      { region: 'EU_CPNP', status: 'restricted', note: '안면용 6%, 인체용 2.2% 이하' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Octinoxate',
    normalized: 'octinoxate',
    koreanName: '에틸헥실 메톡시신나메이트',
    purpose: '자외선 차단제 (UVB)',
    cautions: ['호르몬 교란 우려'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '7.5% 이하' },
      { region: 'US_MoCRA', status: 'allowed', note: '하와이 산호초 보호 목적 사용 제한' },
      { region: 'EU_CPNP', status: 'restricted', note: '10% 이하' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Avobenzone',
    normalized: 'avobenzone',
    koreanName: '부틸 메톡시디벤조일메탄',
    purpose: '자외선 차단제 (UVA)',
    cautions: ['광불안정성'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '5% 이하' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '5% 이하' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Zinc Oxide',
    normalized: 'zinc oxide',
    koreanName: '징크옥사이드',
    purpose: '무기 자외선 차단제',
    cautions: ['나노 입자 흡입 우려'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '나노 형태 흡입 제품 제한' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Titanium Dioxide',
    normalized: 'titanium dioxide',
    koreanName: '티타늄디옥사이드',
    purpose: '무기 자외선 차단제 / 백색 안료',
    cautions: ['나노 입자 흡입 우려'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '경구 분류 제한 + 흡입 제품 제한' },
    ],
    sources: SOURCES_ALL,
  },

  // ─── 방부제 ───
  {
    inci: 'Methylparaben',
    normalized: 'methylparaben',
    koreanName: '메틸파라벤',
    purpose: '방부제',
    cautions: ['호르몬 교란 우려'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '0.4% 이하' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '0.4% 이하' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Propylparaben',
    normalized: 'propylparaben',
    koreanName: '프로필파라벤',
    purpose: '방부제',
    cautions: ['호르몬 교란 우려'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '0.14% 이하' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '0.14% 이하 (영유아 기저귀 부위 금지)' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Butylparaben',
    normalized: 'butylparaben',
    koreanName: '부틸파라벤',
    purpose: '방부제',
    cautions: ['호르몬 교란 우려'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '0.14% 이하' },
      { region: 'US_MoCRA', status: 'unknown', note: 'MoCRA 검토 진행 중' },
      { region: 'EU_CPNP', status: 'restricted', note: '0.14% 이하 (영유아 기저귀 부위 금지)' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Phenoxyethanol',
    normalized: 'phenoxyethanol',
    koreanName: '페녹시에탄올',
    purpose: '방부제',
    cautions: ['고농도 자극'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '1% 이하' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '1% 이하 (3세 이하 얼굴 사용 시 0.4% 이하 권고)' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Benzyl Alcohol',
    normalized: 'benzyl alcohol',
    koreanName: '벤질알코올',
    purpose: '방부제 / 향료 용제',
    cautions: ['알레르기 가능'],
    allergens: ['Benzyl Alcohol'],
    regulations: [
      { region: 'KR', status: 'restricted', note: '1% 이하' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '1% 이하 + 알러젠 표시 의무' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Methylisothiazolinone',
    normalized: 'methylisothiazolinone',
    koreanName: '메칠이소치아졸리논',
    purpose: '방부제',
    cautions: ['강한 접촉성 알레르기 유발'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '0.0015% 이하 (씻어내는 제품만)' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '0.0015% 이하 (씻어내는 제품만, 안 씻는 제품 금지)' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Methylchloroisothiazolinone',
    normalized: 'methylchloroisothiazolinone',
    koreanName: '메칠클로로이소치아졸리논',
    purpose: '방부제',
    cautions: ['매우 강한 접촉성 알레르기'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '0.0015% 이하 (씻어내는 제품만)' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '0.0015% 이하 (씻어내는 제품만)' },
    ],
    sources: SOURCES_ALL,
  },

  // ─── EU CPNP 26 알러젠 (향료) ───
  {
    inci: 'Limonene',
    normalized: 'limonene',
    koreanName: '리모넨',
    purpose: '향료 성분 (시트러스 향)',
    cautions: ['산화 시 알레르기'],
    allergens: ['Limonene'],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '0.001%(안 씻는)/0.01%(씻는) 이상 시 라벨 표시 의무' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Linalool',
    normalized: 'linalool',
    koreanName: '리날룰',
    purpose: '향료 성분 (꽃 향)',
    cautions: ['산화 시 알레르기'],
    allergens: ['Linalool'],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '0.001%/0.01% 이상 라벨 표시 의무' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Citronellol',
    normalized: 'citronellol',
    koreanName: '시트로넬올',
    purpose: '향료 성분 (장미 향)',
    cautions: ['알레르기 가능'],
    allergens: ['Citronellol'],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '0.001%/0.01% 이상 라벨 표시 의무' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Geraniol',
    normalized: 'geraniol',
    koreanName: '제라니올',
    purpose: '향료 성분 (장미 향)',
    cautions: ['알레르기 가능'],
    allergens: ['Geraniol'],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '0.001%/0.01% 이상 라벨 표시 의무' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Eugenol',
    normalized: 'eugenol',
    koreanName: '유제놀',
    purpose: '향료 성분 (정향)',
    cautions: ['알레르기 가능'],
    allergens: ['Eugenol'],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '0.001%/0.01% 이상 라벨 표시 의무' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Citral',
    normalized: 'citral',
    koreanName: '시트랄',
    purpose: '향료 성분 (레몬 향)',
    cautions: ['알레르기 가능'],
    allergens: ['Citral'],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '0.001%/0.01% 이상 라벨 표시 의무' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Coumarin',
    normalized: 'coumarin',
    koreanName: '쿠마린',
    purpose: '향료 성분 (바닐라 향)',
    cautions: ['알레르기 가능'],
    allergens: ['Coumarin'],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '0.001%/0.01% 이상 라벨 표시 의무' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Cinnamyl Alcohol',
    normalized: 'cinnamyl alcohol',
    koreanName: '신나밀알코올',
    purpose: '향료 성분 (계피 향)',
    cautions: ['강한 알레르기 가능'],
    allergens: ['Cinnamyl Alcohol'],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '0.001%/0.01% 이상 라벨 표시 의무' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Benzyl Salicylate',
    normalized: 'benzyl salicylate',
    koreanName: '벤질살리실레이트',
    purpose: '향료 성분 / 자외선 흡수',
    cautions: ['알레르기 가능'],
    allergens: ['Benzyl Salicylate'],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '0.001%/0.01% 이상 라벨 표시 의무' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Isoeugenol',
    normalized: 'isoeugenol',
    koreanName: '이소유제놀',
    purpose: '향료 성분',
    cautions: ['강한 알레르기 가능'],
    allergens: ['Isoeugenol'],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '안 씻는 제품 0.02% / 씻는 제품 0.2% 이하 + 라벨 표시' },
    ],
    sources: SOURCES_ALL,
  },

  // ─── AHA / BHA / 산 ───
  {
    inci: 'Salicylic Acid',
    normalized: 'salicylic acid',
    koreanName: '살리실산',
    purpose: '각질 제거 (BHA)',
    cautions: ['광민감', '임산부 의사 상담'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '0.5% 이하 (씻는 제품 외)' },
      { region: 'US_MoCRA', status: 'restricted', note: 'OTC 약품 분류 농도 제한' },
      { region: 'EU_CPNP', status: 'restricted', note: '농도 제한 + 영유아 사용 금지' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Glycolic Acid',
    normalized: 'glycolic acid',
    koreanName: '글리콜산',
    purpose: '각질 제거 (AHA)',
    cautions: ['광민감', '자극 가능'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '농도 제한 (제품군별)' },
      { region: 'US_MoCRA', status: 'allowed', note: 'pH 3.5 이상 권고' },
      { region: 'EU_CPNP', status: 'restricted', note: '농도 제한' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Lactic Acid',
    normalized: 'lactic acid',
    koreanName: '락트산',
    purpose: '각질 제거 (AHA) / pH 조절',
    cautions: ['광민감'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Mandelic Acid',
    normalized: 'mandelic acid',
    koreanName: '만델산',
    purpose: '각질 제거 (AHA, 저자극)',
    cautions: [],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },

  // ─── 활성 성분 / 효능 ───
  {
    inci: 'Niacinamide',
    normalized: 'niacinamide',
    koreanName: '나이아신아마이드',
    purpose: '미백 / 피지 조절 / 모공',
    cautions: [],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed', note: '미백 기능성 (2~5%)' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Retinol',
    normalized: 'retinol',
    koreanName: '레티놀',
    purpose: '주름 개선 / 각질 정상화',
    cautions: ['광민감', '임산부 사용 금지', '자극 가능'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '주름 개선 기능성 (2,500~10,000IU/g)' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '바디 0.05% / 안면 0.3% 이하' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Retinyl Palmitate',
    normalized: 'retinyl palmitate',
    koreanName: '레티닐 팔미테이트',
    purpose: '주름 개선 (레티놀 유도체)',
    cautions: ['광민감', '임산부 주의'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'unknown', note: 'FDA 안전성 검토 진행' },
      { region: 'EU_CPNP', status: 'restricted', note: '레티놀 환산 농도 제한' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Hydroquinone',
    normalized: 'hydroquinone',
    koreanName: '하이드로퀴논',
    purpose: '미백 (강력)',
    cautions: ['세포 독성 가능', '의사 처방 권고'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'banned', note: '화장품 금지 (의약품 분류)' },
      { region: 'US_MoCRA', status: 'restricted', note: 'OTC 2% / 처방 4%' },
      { region: 'EU_CPNP', status: 'banned', note: '화장품 금지' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Kojic Acid',
    normalized: 'kojic acid',
    koreanName: '코지산',
    purpose: '미백',
    cautions: ['자극 가능'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '1% 이하 권고' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '1% 이하' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Arbutin',
    normalized: 'arbutin',
    koreanName: '알부틴',
    purpose: '미백',
    cautions: [],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed', note: '미백 기능성 (2~5%)' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '알파/베타 형 농도 차이' },
    ],
    sources: SOURCES_ALL,
  },

  // ─── 보습 / 일반 (안전) ───
  {
    inci: 'Glycerin',
    normalized: 'glycerin',
    koreanName: '글리세린',
    purpose: '보습 (수분 유지)',
    cautions: [],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Sodium Hyaluronate',
    normalized: 'sodium hyaluronate',
    koreanName: '히알루론산나트륨',
    purpose: '보습 (수분 흡수)',
    cautions: [],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Squalane',
    normalized: 'squalane',
    koreanName: '스쿠알란',
    purpose: '보습 / 유분 보호막',
    cautions: [],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Ceramide NP',
    normalized: 'ceramide np',
    koreanName: '세라마이드 NP',
    purpose: '피부 장벽 강화',
    cautions: [],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Panthenol',
    normalized: 'panthenol',
    koreanName: '판테놀 (프로비타민 B5)',
    purpose: '보습 / 진정',
    cautions: [],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },

  // ─── 계면활성제 ───
  {
    inci: 'Sodium Lauryl Sulfate',
    normalized: 'sodium lauryl sulfate',
    koreanName: '소듐라우릴설페이트 (SLS)',
    purpose: '세정 / 거품',
    cautions: ['강한 자극', '건성 피부 주의'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Sodium Laureth Sulfate',
    normalized: 'sodium laureth sulfate',
    koreanName: '소듐라우레스설페이트 (SLES)',
    purpose: '세정 / 거품',
    cautions: ['1,4-Dioxane 부산물 우려 (제조 공정 의존)'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'restricted', note: '1,4-Dioxane 검출 기준' },
      { region: 'EU_CPNP', status: 'restricted', note: '1,4-Dioxane 10ppm 이하' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Cocamidopropyl Betaine',
    normalized: 'cocamidopropyl betaine',
    koreanName: '코카미도프로필베타인',
    purpose: '저자극 계면활성제',
    cautions: ['알레르기 가능 (불순물 의존)'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },

  // ─── MoCRA 모니터링 / 기타 규제 ───
  {
    inci: 'Talc',
    normalized: 'talc',
    koreanName: '탈크',
    purpose: '안료 / 흡유',
    cautions: ['석면 혼입 가능성', '흡입 주의'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '석면 미검출 의무' },
      { region: 'US_MoCRA', status: 'restricted', note: 'MoCRA Annex 1B 모니터링 (석면 검토)' },
      { region: 'EU_CPNP', status: 'restricted', note: '석면 미검출 의무, 흡입 제품 제한' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Perfluorooctanoic Acid',
    normalized: 'perfluorooctanoic acid',
    koreanName: 'PFOA',
    purpose: 'PFAS 계열 (오염원)',
    cautions: ['장기 잔류 / 환경·건강 우려'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'banned' },
      { region: 'US_MoCRA', status: 'restricted', note: 'PFAS 사용 모니터링 강화' },
      { region: 'EU_CPNP', status: 'banned' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Formaldehyde',
    normalized: 'formaldehyde',
    koreanName: '포름알데하이드',
    purpose: '방부 (현재 직접 사용은 거의 없음)',
    cautions: ['발암성', '강한 알레르기'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'restricted', note: '0.05% 이하' },
      { region: 'US_MoCRA', status: 'restricted', note: 'OTC 분류 제한' },
      { region: 'EU_CPNP', status: 'banned', note: '직접 사용 금지 (방출 성분만 제한)' },
    ],
    sources: SOURCES_ALL,
  },

  // ─── 기타 빈도 높은 성분 ───
  {
    inci: 'Dimethicone',
    normalized: 'dimethicone',
    koreanName: '디메치콘',
    purpose: '실리콘 (피부 보호막)',
    cautions: [],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Mineral Oil',
    normalized: 'mineral oil',
    koreanName: '미네랄오일',
    purpose: '보습 / 유분 보호막',
    cautions: ['정제도 의존 (불순물 시 자극)'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed', note: '정제 등급 의무' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '정제도 기준' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Petrolatum',
    normalized: 'petrolatum',
    koreanName: '바셀린',
    purpose: '피부 보호막',
    cautions: [],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'restricted', note: '정제도 기준' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Disodium EDTA',
    normalized: 'disodium edta',
    koreanName: '디소듐이디티에이',
    purpose: '킬레이트제 (금속 이온 봉쇄)',
    cautions: [],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Tocopherol',
    normalized: 'tocopherol',
    koreanName: '토코페롤 (비타민 E)',
    purpose: '항산화',
    cautions: [],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Ascorbic Acid',
    normalized: 'ascorbic acid',
    koreanName: '아스코르브산 (비타민 C)',
    purpose: '항산화 / 미백',
    cautions: ['산화 안정성 낮음'],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Caffeine',
    normalized: 'caffeine',
    koreanName: '카페인',
    purpose: '혈류 개선 / 부종 완화',
    cautions: [],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },
  {
    inci: 'Adenosine',
    normalized: 'adenosine',
    koreanName: '아데노신',
    purpose: '주름 개선 (기능성)',
    cautions: [],
    allergens: [],
    regulations: [
      { region: 'KR', status: 'allowed', note: '주름 개선 기능성 (0.04%)' },
      { region: 'US_MoCRA', status: 'allowed' },
      { region: 'EU_CPNP', status: 'allowed' },
    ],
    sources: SOURCES_ALL,
  },
];

/**
 * 사전 매칭용 정규화 함수. AI 응답의 ingredient.name도 같은
 * 함수로 정규화한 뒤 비교한다.
 *
 * - 소문자
 * - 양 끝 공백 제거
 * - 연속 공백 1개로
 * - 괄호 안 내용 제거 (예: "Tocopherol (Vitamin E)" → "tocopherol")
 *
 * Refs: SPEC.md §5.3 정규화 규칙
 */
export const normalizeIngredientName = (s: string): string => {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, '') // 괄호 제거
    .trim()
    .replace(/\s+/g, ' ');
};

/**
 * 정규화된 이름으로 정적 사전에서 매칭 항목 찾기.
 */
export const findStaticIngredient = (name: string): StaticIngredient | undefined => {
  const normalized = normalizeIngredientName(name);
  return STATIC_INGREDIENTS.find((s) => s.normalized === normalized);
};
