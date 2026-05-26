/**
 * 공용 Button — primary/secondary/ghost 3종, sm/md/lg 3 사이즈.
 * 비활성 상태와 로딩 인디케이터를 함께 표시.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { StyledButton } from './style';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  children,
  ...rest
}: Props) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading ? '처리 중…' : children}
    </StyledButton>
  );
};
