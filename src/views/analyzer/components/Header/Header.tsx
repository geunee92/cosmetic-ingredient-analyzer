/**
 * 상단 헤더 — 앱 이름 + rate limit 잔여 횟수 뱃지.
 *
 * remaining이 0이면 빨강, 1~2면 노랑, 그 외 회색.
 * SPEC §3.3.1.
 */

import { useAnalyzerStore } from '@/store/analyzerStore';
import { Container, AppTitle, QuotaBadge } from './style';

const getTone = (remaining: number, limit: number) => {
  if (remaining <= 0) return 'danger' as const;
  if (remaining <= Math.max(1, Math.floor(limit * 0.2))) return 'warning' as const;
  return 'neutral' as const;
};

export const Header = () => {
  const rateLimit = useAnalyzerStore((s) => s.rateLimit);

  return (
    <Container>
      <AppTitle>화장품 성분 분석기</AppTitle>
      {rateLimit && (
        <QuotaBadge tone={getTone(rateLimit.remaining, rateLimit.limit)} aria-label={`오늘 남은 분석 횟수 ${rateLimit.remaining}회 (총 ${rateLimit.limit}회)`}>
          {rateLimit.remaining}/{rateLimit.limit}
        </QuotaBadge>
      )}
    </Container>
  );
};
