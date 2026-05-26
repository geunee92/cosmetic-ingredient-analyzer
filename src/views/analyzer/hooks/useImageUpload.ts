/**
 * 이미지 업로드 훅 — File → base64 변환 + 클라이언트 검증.
 *
 * 검증 (SPEC §3.3.4):
 *   - MIME: image/jpeg | image/png | image/webp
 *   - 크기: ≤ 5MB
 *
 * 검증 실패는 인라인 에러로 호출자에게 반환. store에 직접 set하지 않음
 * (View와 분리해서 훅이 store 의존을 최소화).
 */

import { useState } from 'react';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
type AllowedMime = (typeof ALLOWED_MIME)[number];

const isAllowedMime = (mime: string): mime is AllowedMime => {
  return (ALLOWED_MIME as readonly string[]).includes(mime);
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('FileReader 결과가 문자열이 아닙니다'));
        return;
      }
      const base64 = dataUrl.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
};

type UploadResult = {
  base64: string;
  mimeType: AllowedMime;
  fileName: string;
};

export type UseImageUpload = {
  upload: (file: File) => Promise<UploadResult>;
  isProcessing: boolean;
  error: string | null;
  clearError: () => void;
};

export const useImageUpload = (): UseImageUpload => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<UploadResult> => {
    setError(null);

    if (!isAllowedMime(file.type)) {
      const msg = `지원하지 않는 이미지 형식입니다 (JPEG / PNG / WebP만 지원)`;
      setError(msg);
      throw new Error(msg);
    }

    if (file.size > MAX_BYTES) {
      const msg = `이미지는 5MB 이하여야 합니다 (현재 ${(file.size / 1024 / 1024).toFixed(1)}MB)`;
      setError(msg);
      throw new Error(msg);
    }

    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(file);
      return { base64, mimeType: file.type, fileName: file.name };
    } catch (err) {
      const msg = err instanceof Error ? err.message : '파일 읽기 중 오류가 발생했습니다';
      setError(msg);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const clearError = () => setError(null);

  return { upload, isProcessing, error, clearError };
};
