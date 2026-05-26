import styled from '@emotion/styled';

export const ContentWrap = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

export const LoadingBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.font.sizes.sm};
`;

export const ErrorBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  margin: 0 ${({ theme }) => theme.spacing.lg};
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: ${({ theme }) => theme.radius.md};
`;

export const ErrorTitle = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.md};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.danger};
`;

export const ErrorMessage = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.text};
`;

export const Helper = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.xs};
  color: ${({ theme }) => theme.colors.textTertiary};
`;
