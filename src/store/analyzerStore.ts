/**
 * 분석기 클라이언트 상태 (Zustand).
 *
 * 상태 머신: idle → loading → done | error.
 * rate limit 잔여 횟수와 폴백 정보를 함께 보관해 결과/헤더 표시에 사용.
 */

import { create } from 'zustand';
import type { AnalysisResult } from '../../api/_lib/schema';

export type AnalyzerStatus = 'idle' | 'loading' | 'done' | 'error';

export type InputKind = 'text' | 'image';

export type AnalyzerError = {
  code:
    | 'bad_request'
    | 'rate_limit'
    | 'all_providers_failed'
    | 'auth'
    | 'internal_error'
    | 'network';
  message: string;
  resetAt?: number;
};

export type ProviderName = 'openai' | 'claude';

export type AttemptInfo = {
  provider: ProviderName;
  status: 'success' | 'failed';
  errorType?: string;
  durationMs: number;
};

export type RateLimitState = {
  limit: number;
  remaining: number;
  resetAt: number;
};

type State = {
  status: AnalyzerStatus;
  inputKind: InputKind;
  text: string;
  imageBase64: string | null;
  imageMime: 'image/jpeg' | 'image/png' | 'image/webp' | null;
  imageFileName: string | null;
  result: AnalysisResult | null;
  usedProvider: ProviderName | null;
  attempts: AttemptInfo[];
  error: AnalyzerError | null;
  rateLimit: RateLimitState | null;
};

type Actions = {
  setInputKind: (kind: InputKind) => void;
  setText: (text: string) => void;
  setImage: (params: { base64: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp'; fileName: string }) => void;
  clearImage: () => void;
  startAnalysis: () => void;
  setSuccess: (params: {
    result: AnalysisResult;
    usedProvider: ProviderName;
    attempts: AttemptInfo[];
  }) => void;
  setError: (err: AnalyzerError) => void;
  setRateLimit: (rl: RateLimitState) => void;
  reset: () => void;
};

const initialState: State = {
  status: 'idle',
  inputKind: 'text',
  text: '',
  imageBase64: null,
  imageMime: null,
  imageFileName: null,
  result: null,
  usedProvider: null,
  attempts: [],
  error: null,
  rateLimit: null,
};

export const useAnalyzerStore = create<State & Actions>((set) => ({
  ...initialState,

  setInputKind: (kind) => set({ inputKind: kind, error: null }),

  setText: (text) => set({ text, error: null }),

  setImage: ({ base64, mimeType, fileName }) =>
    set({ imageBase64: base64, imageMime: mimeType, imageFileName: fileName, error: null }),

  clearImage: () => set({ imageBase64: null, imageMime: null, imageFileName: null }),

  startAnalysis: () => set({ status: 'loading', error: null, result: null, attempts: [] }),

  setSuccess: ({ result, usedProvider, attempts }) =>
    set({ status: 'done', result, usedProvider, attempts, error: null }),

  setError: (err) => set({ status: 'error', error: err, result: null }),

  setRateLimit: (rl) => set({ rateLimit: rl }),

  // 다시 분석 시 rateLimit은 보존 (0/10 같은 잔여 횟수 표시가 사라지면 UX 불안)
  reset: () => set((state) => ({ ...initialState, rateLimit: state.rateLimit })),
}));
