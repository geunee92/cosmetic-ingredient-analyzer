/**
 * 국가별 규제 뱃지 — 한국 / MoCRA / CPNP 3개.
 *
 * Region별 라벨과 상태별 톤을 한 곳에서 매핑.
 */

import type { Regulation, RegulationStatus } from '../../../../../api/_lib/schema';
import { Badge, type BadgeTone } from '@/components/base/Badge';
import { Row } from './style';

type Props = {
  regulations: Regulation[];
};

const regionLabel: Record<Regulation['region'], string> = {
  KR: '🇰🇷 한국',
  US_MoCRA: '🇺🇸 MoCRA',
  EU_CPNP: '🇪🇺 CPNP',
};

const statusLabel: Record<RegulationStatus, string> = {
  allowed: '허용',
  restricted: '제한',
  banned: '금지',
  unknown: '불명',
};

const statusTone: Record<RegulationStatus, BadgeTone> = {
  allowed: 'success',
  restricted: 'warning',
  banned: 'danger',
  unknown: 'neutral',
};

export const RegulationBadges = ({ regulations }: Props) => {
  return (
    <Row>
      {regulations.map((r) => (
        <Badge key={r.region} tone={statusTone[r.status]} size="sm">
          {regionLabel[r.region]} {statusLabel[r.status]}
          {r.note ? ` · ${r.note}` : ''}
        </Badge>
      ))}
    </Row>
  );
};
