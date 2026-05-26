import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const SpinnerRing = styled.span<{ size: number }>`
  display: inline-block;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;
