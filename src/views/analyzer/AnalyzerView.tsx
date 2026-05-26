/**
 * AnalyzerView — 단일 화면 컨테이너.
 *
 * 상태별 영역 렌더:
 *   - idle: Header + InputSection
 *   - loading: Header + InputSection (disabled) + Loading 영역
 *   - done:    Header + InputSection + ResultSection
 *   - error:   Header + InputSection + ErrorSection
 *
 * View only — 로직은 하위 컴포넌트의 훅에서 처리.
 */

import { useAnalyzerStore } from '@/store/analyzerStore';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { ResultSection } from './components/ResultSection';
import { Spinner } from '@/components/base/Spinner';
import { Button } from '@/components/base/Button';
import { LoadingBlock, ErrorBlock, ErrorTitle, ErrorMessage, Helper, ContentWrap } from './style';

type ErrorPresentation = {
  title: string;
  hint?: string;
};

const presentError = (code: string): ErrorPresentation => {
  switch (code) {
    case 'bad_request':
      return {
        title: '입력을 다시 확인해주세요',
        hint: '성분표 텍스트가 비어 있거나 이미지가 너무 클 수 있어요.',
      };
    case 'rate_limit':
      return {
        title: '오늘 분석 횟수를 모두 사용했어요',
        hint: '한국 시간 자정에 리셋됩니다.',
      };
    case 'all_providers_failed':
      return {
        title: '분석에 실패했어요',
        hint: 'AI 서비스 일시 장애일 수 있어요. 잠시 후 다시 시도해주세요.',
      };
    case 'auth':
      return {
        title: '일시적인 서버 문제예요',
        hint: '관리자에게 문의하거나 잠시 후 다시 시도해주세요.',
      };
    case 'network':
      return {
        title: '네트워크 연결을 확인해주세요',
        hint: '오프라인이거나 응답이 너무 느린 상태예요.',
      };
    case 'internal_error':
    default:
      return {
        title: '잠시 후 다시 시도해주세요',
      };
  }
};

const formatResetTime = (epochSec: number): string => {
  const date = new Date(epochSec * 1000);
  return date.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
};

export const AnalyzerView = () => {
  const status = useAnalyzerStore((s) => s.status);
  const error = useAnalyzerStore((s) => s.error);
  const clearError = useAnalyzerStore((s) => s.clearError);

  return (
    <>
      <Header />
      <ContentWrap>
        <InputSection />

        {status === 'loading' && (
          <LoadingBlock role="status" aria-live="polite">
            <Spinner size={28} />
            <div>AI가 성분을 분석 중입니다…</div>
            <Helper>최대 15초 정도 걸릴 수 있어요</Helper>
          </LoadingBlock>
        )}

        {status === 'done' && <ResultSection />}

        {status === 'error' && error && (() => {
          const view = presentError(error.code);
          return (
            <ErrorBlock role="alert">
              <ErrorTitle>{view.title}</ErrorTitle>
              {view.hint && <ErrorMessage>{view.hint}</ErrorMessage>}
              {error.code === 'rate_limit' && error.resetAt ? (
                <Helper>리셋 시각: {formatResetTime(error.resetAt)}</Helper>
              ) : (
                <Button variant="secondary" size="md" onClick={clearError}>
                  다시 시도
                </Button>
              )}
            </ErrorBlock>
          );
        })()}
      </ContentWrap>
    </>
  );
};
