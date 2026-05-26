import styled from '@emotion/styled';
import { css } from '@emotion/react';
import type { AppTheme } from '@/styles/theme';
import type { BadgeTone } from './Badge';

const toneStyles = (theme: AppTheme, tone: BadgeTone) => {
  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: theme.colors.bgSoft, fg: theme.colors.textSecondary },
    primary: { bg: '#f3e8ff', fg: theme.colors.primary },
    success: { bg: '#d1fae5', fg: theme.colors.success },
    warning: { bg: '#fef3c7', fg: '#92400e' },
    danger: { bg: '#fee2e2', fg: theme.colors.danger },
    info: { bg: '#dbeafe', fg: theme.colors.info },
  };
  const c = map[tone];
  return css`
    background: ${c.bg};
    color: ${c.fg};
  `;
};

export const StyledBadge = styled.span<{ tone: BadgeTone; size: 'sm' | 'md' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ size }) => (size === 'md' ? '4px 10px' : '2px 8px')};
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: ${({ theme, size }) => (size === 'md' ? theme.font.sizes.sm : theme.font.sizes.xs)};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  white-space: nowrap;
  ${({ theme, tone }) => toneStyles(theme, tone)};
`;
