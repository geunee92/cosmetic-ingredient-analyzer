import styled from '@emotion/styled';
import { css } from '@emotion/react';

type Tone = 'neutral' | 'warning' | 'danger';

export const Container = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  position: sticky;
  top: 0;
  z-index: 10;
`;

export const AppTitle = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.font.sizes.md};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

export const QuotaBadge = styled.div<{ tone: Tone }>`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.pill};
  ${({ theme, tone }) => {
    switch (tone) {
      case 'danger':
        return css`
          background: #fee2e2;
          color: ${theme.colors.danger};
        `;
      case 'warning':
        return css`
          background: #fef3c7;
          color: #92400e;
        `;
      case 'neutral':
      default:
        return css`
          background: ${theme.colors.bgSoft};
          color: ${theme.colors.textSecondary};
        `;
    }
  }};
`;
