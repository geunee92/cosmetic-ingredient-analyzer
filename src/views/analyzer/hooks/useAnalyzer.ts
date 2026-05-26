/**
 * useAnalyzer — 입력 → API 호출 → store 상태 동기화.
 *
 * 컴포넌트는 이 훅의 `run`만 호출. 모든 분기 처리는 훅 안에서.
 */

import { useCallback } from 'react';
import { analyzeIngredients, type AnalyzeRequest } from '@/lib/api';
import { useAnalyzerStore } from '@/store/analyzerStore';

export const useAnalyzer = () => {
  const inputKind = useAnalyzerStore((s) => s.inputKind);
  const text = useAnalyzerStore((s) => s.text);
  const imageBase64 = useAnalyzerStore((s) => s.imageBase64);
  const imageMime = useAnalyzerStore((s) => s.imageMime);
  const status = useAnalyzerStore((s) => s.status);
  const startAnalysis = useAnalyzerStore((s) => s.startAnalysis);
  const setSuccess = useAnalyzerStore((s) => s.setSuccess);
  const setError = useAnalyzerStore((s) => s.setError);
  const setRateLimit = useAnalyzerStore((s) => s.setRateLimit);

  const run = useCallback(async () => {
    if (status === 'loading') return;

    let req: AnalyzeRequest;
    if (inputKind === 'text') {
      if (!text.trim()) {
        setError({ code: 'bad_request', message: '성분표를 입력해주세요' });
        return;
      }
      req = { kind: 'text', ingredients: text };
    } else {
      if (!imageBase64 || !imageMime) {
        setError({ code: 'bad_request', message: '이미지를 선택해주세요' });
        return;
      }
      req = { kind: 'image', base64: imageBase64, mimeType: imageMime };
    }

    startAnalysis();
    const response = await analyzeIngredients(req);

    if (response.rateLimit) {
      setRateLimit(response.rateLimit);
    }

    if (response.error) {
      setError(response.error);
      return;
    }

    if (response.data) {
      setSuccess({
        result: response.data.result,
        usedProvider: response.data.usedProvider,
        attempts: response.data.attempts,
      });
    }
  }, [inputKind, text, imageBase64, imageMime, status, startAnalysis, setSuccess, setError, setRateLimit]);

  return { run };
};
