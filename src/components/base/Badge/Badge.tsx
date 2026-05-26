/**
 * 인라인 뱃지 — 상태/카테고리 표시.
 * tone으로 색상 카테고리, size로 폰트 크기.
 */

import type { ReactNode } from 'react';
import { StyledBadge } from './style';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type Size = 'sm' | 'md';

type Props = {
  tone?: BadgeTone;
  size?: Size;
  children: ReactNode;
};

export const Badge = ({ tone = 'neutral', size = 'sm', children }: Props) => {
  return (
    <StyledBadge tone={tone} size={size}>
      {children}
    </StyledBadge>
  );
};
