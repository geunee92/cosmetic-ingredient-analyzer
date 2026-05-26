/**
 * 결과 영역 — 폴백 배너 + 성분 카드 리스트 + Disclaimer + 다시 분석.
 */

import { useAnalyzerStore } from '@/store/analyzerStore';
import { Button } from '@/components/base/Button';
import { IngredientCard } from '../IngredientCard';
import { Container, FallbackBanner, CardList, WarningsBox, Disclaimer, ActionRow } from './style';

const providerLabel: Record<'openai' | 'claude', string> = {
  openai: 'OpenAI',
  claude: 'Claude',
};

export const ResultSection = () => {
  const result = useAnalyzerStore((s) => s.result);
  const usedProvider = useAnalyzerStore((s) => s.usedProvider);
  const attempts = useAnalyzerStore((s) => s.attempts);
  const reset = useAnalyzerStore((s) => s.reset);

  if (!result || !usedProvider) return null;

  const fallbackOccurred = attempts.some((a) => a.status === 'failed');
  const firstFailed = attempts.find((a) => a.status === 'failed');

  return (
    <Container aria-live="polite">
      {fallbackOccurred && firstFailed && (
        <FallbackBanner role="status">
          1차 분석({providerLabel[firstFailed.provider]}) 실패 →{' '}
          <strong>{providerLabel[usedProvider]}</strong>로 분석 완료
        </FallbackBanner>
      )}

      {result.warnings && result.warnings.length > 0 && (
        <WarningsBox role="note">
          {result.warnings.map((w, idx) => (
            <div key={idx}>⚠ {w}</div>
          ))}
        </WarningsBox>
      )}

      <CardList>
        {result.ingredients.map((ing, idx) => (
          <IngredientCard key={`${ing.name}-${idx}`} ingredient={ing} />
        ))}
      </CardList>

      <Disclaimer>{result.disclaimer}</Disclaimer>

      <ActionRow>
        <Button variant="secondary" fullWidth onClick={reset}>
          다시 분석
        </Button>
      </ActionRow>
    </Container>
  );
};
