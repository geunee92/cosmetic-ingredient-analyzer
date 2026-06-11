/**
 * 단일 성분 카드 — 효능 / 주의 / 알러젠 / 규제 / 출처.
 */

import type { Ingredient } from '../../../../../api/_lib/schema';
import { Badge } from '@/components/base/Badge';
import { RegulationBadges } from '../RegulationBadges';
import {
  Card,
  Header,
  NameRow,
  Name,
  KoreanName,
  Purpose,
  Section,
  SectionLabel,
  TagRow,
  Footer,
} from './style';

type Props = {
  ingredient: Ingredient;
};

export const IngredientCard = ({ ingredient }: Props) => {
  // safe 성분(§12): 규제·주의 무관으로 분류되어 상세 필드가 없음 → 이름+효능만 간단 표시.
  const isSafe = ingredient.tier === 'safe';
  const cautions = ingredient.cautions ?? [];
  const allergens = ingredient.allergens ?? [];
  const regulations = ingredient.regulations ?? [];

  return (
    <Card>
      <Header>
        <NameRow>
          <Name>{ingredient.name}</Name>
          {ingredient.koreanName && <KoreanName>{ingredient.koreanName}</KoreanName>}
        </NameRow>
        {isSafe ? (
          <Badge tone="neutral" size="sm">
            기본 안전
          </Badge>
        ) : (
          <Badge tone={ingredient.source === 'static' ? 'neutral' : 'primary'} size="sm">
            {ingredient.source === 'static' ? '정적 사전' : 'AI 분석'}
          </Badge>
        )}
      </Header>

      <Purpose>{ingredient.purpose}</Purpose>

      {!isSafe && (
        <>
          {cautions.length > 0 && (
            <Section>
              <SectionLabel>⚠ 주의</SectionLabel>
              <TagRow>
                {cautions.map((c) => (
                  <Badge key={c} tone="warning" size="sm">
                    {c}
                  </Badge>
                ))}
              </TagRow>
            </Section>
          )}

          {allergens.length > 0 && (
            <Section>
              <SectionLabel>🌿 알레르기 가능</SectionLabel>
              <TagRow>
                {allergens.map((a) => (
                  <Badge key={a} tone="danger" size="sm">
                    {a}
                  </Badge>
                ))}
              </TagRow>
            </Section>
          )}

          {regulations.length > 0 && (
            <Section>
              <SectionLabel>국가별 규제</SectionLabel>
              <RegulationBadges regulations={regulations} />
            </Section>
          )}

          {ingredient.confidence !== undefined && (
            <Footer>신뢰도 {Math.round(ingredient.confidence * 100)}%</Footer>
          )}
        </>
      )}
    </Card>
  );
};
