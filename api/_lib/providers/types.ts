/**
 * AI Provider 추상화.
 *
 * 향후 OCR / 라벨 분석 등 다른 도메인에도 동일 폴백 패턴을
 * 재사용하기 위해 제네릭으로 정의. (확장성 vs YAGNI 의도적 결정)
 *
 * 참조: SPEC.md §4 API, §5 데이터, 사전 점검 #1
 */

export type ProviderName = 'openai' | 'claude';

/**
 * 분석기 진입 입력. 텍스트와 이미지를 discriminated union으로 분리.
 * provider 내부에서 각 SDK 형식으로 변환한다.
 *
 * - text: 사용자가 직접 붙여넣은 성분표
 * - image: base64 인코딩 + MIME 타입 (OpenAI는 data URL로,
 *   Claude는 source 객체로 각자 변환)
 */
export type AnalyzeInput =
  | { kind: 'text'; ingredients: string }
  | { kind: 'image'; base64: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' };

/**
 * AI Provider가 구현해야 하는 단일 메서드 인터페이스.
 *
 * @template TInput  분석기 입력 형식
 * @template TOutput 분석 결과 형식
 */
export type AIProvider<TInput, TOutput> = {
  readonly name: ProviderName;
  analyze: (input: TInput) => Promise<TOutput>;
};
