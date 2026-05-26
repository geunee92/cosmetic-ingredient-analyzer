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
  return (
    <Card>
      <Header>
        <NameRow>
          <Name>{ingredient.name}</Name>
          {ingredient.koreanName && <KoreanName>{ingredient.koreanName}</KoreanName>}
        </NameRow>
        <Badge tone={ingredient.source === 'static' ? 'neutral' : 'primary'} size="sm">
          {ingredient.source === 'static' ? '정적 사전' : 'AI 분석'}
        </Badge>
      </Header>

      <Purpose>{ingredient.purpose}</Purpose>

      {ingredient.cautions.length > 0 && (
        <Section>
          <SectionLabel>⚠ 주의</SectionLabel>
          <TagRow>
            {ingredient.cautions.map((c) => (
              <Badge key={c} tone="warning" size="sm">
                {c}
              </Badge>
            ))}
          </TagRow>
        </Section>
      )}

      {ingredient.allergens.length > 0 && (
        <Section>
          <SectionLabel>🌿 알레르기 가능</SectionLabel>
          <TagRow>
            {ingredient.allergens.map((a) => (
              <Badge key={a} tone="danger" size="sm">
                {a}
              </Badge>
            ))}
          </TagRow>
        </Section>
      )}

      <Section>
        <SectionLabel>국가별 규제</SectionLabel>
        <RegulationBadges regulations={ingredient.regulations} />
      </Section>

      <Footer>신뢰도 {Math.round(ingredient.confidence * 100)}%</Footer>
    </Card>
  );
};
