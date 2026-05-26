/**
 * 입력 영역 — 텍스트/이미지 토글 + 입력 컨트롤 + 분석 버튼.
 *
 * 로직은 useAnalyzer + useImageUpload에 위임. 이 컴포넌트는 View만.
 */

import { useRef, type ChangeEvent, type DragEvent } from 'react';
import { useAnalyzerStore } from '@/store/analyzerStore';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useAnalyzer } from '../../hooks/useAnalyzer';
import { Button } from '@/components/base/Button';
import {
  Container,
  ToggleRow,
  ToggleButton,
  TextArea,
  Counter,
  ImageDrop,
  ImagePreview,
  ImageInfo,
  InlineError,
} from './style';

const MAX_TEXT = 5000;

export const InputSection = () => {
  const inputKind = useAnalyzerStore((s) => s.inputKind);
  const text = useAnalyzerStore((s) => s.text);
  const imageBase64 = useAnalyzerStore((s) => s.imageBase64);
  const imageMime = useAnalyzerStore((s) => s.imageMime);
  const imageFileName = useAnalyzerStore((s) => s.imageFileName);
  const status = useAnalyzerStore((s) => s.status);
  const rateLimit = useAnalyzerStore((s) => s.rateLimit);
  const setInputKind = useAnalyzerStore((s) => s.setInputKind);
  const setText = useAnalyzerStore((s) => s.setText);
  const setImage = useAnalyzerStore((s) => s.setImage);
  const clearImage = useAnalyzerStore((s) => s.clearImage);

  const { upload, isProcessing, error: imageError, clearError } = useImageUpload();
  const { run } = useAnalyzer();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onPickFile = async (file: File) => {
    clearError();
    try {
      const uploaded = await upload(file);
      setImage(uploaded);
    } catch {
      // useImageUpload가 이미 error 상태 set
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void onPickFile(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void onPickFile(file);
  };

  const textTooLong = text.length > MAX_TEXT;
  const isEmpty = inputKind === 'text' ? !text.trim() : !imageBase64;
  const noQuota = rateLimit !== null && rateLimit.remaining <= 0;
  const isLoading = status === 'loading' || isProcessing;
  const disabled = isEmpty || textTooLong || noQuota || isLoading;

  return (
    <Container>
      <ToggleRow role="tablist" aria-label="입력 방식 선택">
        <ToggleButton
          type="button"
          role="tab"
          aria-selected={inputKind === 'text'}
          active={inputKind === 'text'}
          onClick={() => setInputKind('text')}
        >
          텍스트
        </ToggleButton>
        <ToggleButton
          type="button"
          role="tab"
          aria-selected={inputKind === 'image'}
          active={inputKind === 'image'}
          onClick={() => setInputKind('image')}
        >
          이미지
        </ToggleButton>
      </ToggleRow>

      {inputKind === 'text' && (
        <>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Water, Glycerin, Niacinamide, ... 처럼 성분표를 붙여넣어주세요"
            aria-label="화장품 성분표 입력"
            aria-invalid={textTooLong}
            rows={6}
          />
          <Counter tooLong={textTooLong}>
            {text.length} / {MAX_TEXT}
          </Counter>
        </>
      )}

      {inputKind === 'image' && (
        <>
          <ImageDrop
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="이미지를 클릭해서 선택하거나 드래그앤드롭으로 업로드"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            {imageBase64 && imageMime ? (
              <>
                <ImagePreview src={`data:${imageMime};base64,${imageBase64}`} alt="업로드한 성분표 이미지" />
                <ImageInfo>{imageFileName}</ImageInfo>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearImage();
                    clearError();
                  }}
                >
                  삭제
                </Button>
              </>
            ) : (
              <>
                <p>탭하거나 이미지를 끌어다 놓으세요</p>
                <p style={{ fontSize: 12, color: '#999' }}>JPEG · PNG · WebP · 5MB 이하</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={onFileInputChange}
              style={{ display: 'none' }}
            />
          </ImageDrop>
          {imageError && <InlineError role="alert">{imageError}</InlineError>}
        </>
      )}

      {textTooLong && <InlineError role="alert">텍스트는 5000자 이하여야 합니다</InlineError>}

      <Button fullWidth size="lg" disabled={disabled} loading={isLoading} onClick={() => void run()}>
        {noQuota ? '오늘 분석 횟수 소진' : '분석'}
      </Button>
    </Container>
  );
};
