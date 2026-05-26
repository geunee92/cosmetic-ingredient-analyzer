import styled from '@emotion/styled';
import { css } from '@emotion/react';
import type { AppTheme } from '@/styles/theme';

type StyleProps = {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  fullWidth: boolean;
};

const sizeStyles = (theme: AppTheme, size: StyleProps['size']) => {
  switch (size) {
    case 'sm':
      return css`
        height: 32px;
        padding: 0 ${theme.spacing.md};
        font-size: ${theme.font.sizes.sm};
      `;
    case 'lg':
      return css`
        height: 52px;
        padding: 0 ${theme.spacing.xl};
        font-size: ${theme.font.sizes.md};
      `;
    case 'md':
    default:
      return css`
        height: 44px;
        padding: 0 ${theme.spacing.lg};
        font-size: ${theme.font.sizes.base};
      `;
  }
};

const variantStyles = (theme: AppTheme, variant: StyleProps['variant']) => {
  switch (variant) {
    case 'secondary':
      return css`
        background: ${theme.colors.bgSoft};
        color: ${theme.colors.text};
        border: 1px solid ${theme.colors.border};
        &:hover:not(:disabled) {
          background: ${theme.colors.border};
        }
      `;
    case 'ghost':
      return css`
        background: transparent;
        color: ${theme.colors.text};
        border: none;
        &:hover:not(:disabled) {
          background: ${theme.colors.bgSoft};
        }
      `;
    case 'primary':
    default:
      return css`
        background: ${theme.colors.primary};
        color: #ffffff;
        border: none;
        &:hover:not(:disabled) {
          background: ${theme.colors.primaryHover};
        }
        &:disabled {
          background: ${theme.colors.primaryDisabled};
        }
      `;
  }
};

export const StyledButton = styled.button<StyleProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  transition: background 0.15s ease, opacity 0.15s ease;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};

  ${({ theme, size }) => sizeStyles(theme, size)};
  ${({ theme, variant }) => variantStyles(theme, variant)};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;
