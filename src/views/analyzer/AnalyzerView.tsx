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

const errorTitle: Record<string, string> = {
  bad_request: '입력을 다시 확인해주세요',
  rate_limit: '오늘 분석 횟수를 모두 사용했어요',
  all_providers_failed: '분석에 실패했어요',
  auth: '일시적인 서버 문제예요',
  internal_error: '잠시 후 다시 시도해주세요',
  network: '네트워크 연결을 확인해주세요',
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

        {status === 'error' && error && (
          <ErrorBlock role="alert">
            <ErrorTitle>{errorTitle[error.code] ?? '오류가 발생했습니다'}</ErrorTitle>
            <ErrorMessage>{error.message}</ErrorMessage>
            {error.code === 'rate_limit' && error.resetAt && (
              <Helper>리셋: {formatResetTime(error.resetAt)}</Helper>
            )}
            {error.code !== 'rate_limit' && (
              <Button variant="secondary" size="md" onClick={clearError}>
                다시 시도
              </Button>
            )}
          </ErrorBlock>
        )}
      </ContentWrap>
    </>
  );
};
