/**
 * Provider 배열의 단일 진입점.
 * 순서가 곧 폴백 순서 (앞이 1차, 뒤가 2차).
 *
 * Refs: SPEC.md §6.6 모델 / 파라미터
 */

import { openaiProvider } from './openai';
import { claudeProvider } from './claude';

export const providers = [openaiProvider, claudeProvider] as const;

export type { AIProvider, AnalyzeInput, ProviderName } from './types';
