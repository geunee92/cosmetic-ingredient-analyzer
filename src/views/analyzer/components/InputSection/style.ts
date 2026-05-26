import styled from '@emotion/styled';

export const Container = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
`;

export const ToggleRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.bgSoft};
  border-radius: ${({ theme }) => theme.radius.md};
`;

export const ToggleButton = styled.button<{ active: boolean }>`
  flex: 1;
  height: 36px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  background: ${({ theme, active }) => (active ? theme.colors.bg : 'transparent')};
  color: ${({ theme, active }) => (active ? theme.colors.text : theme.colors.textSecondary)};
  box-shadow: ${({ theme, active }) => (active ? theme.colors.cardShadow : 'none')};
  transition: background 0.15s ease;
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 140px;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &[aria-invalid='true'] {
    border-color: ${({ theme }) => theme.colors.danger};
  }
`;

export const Counter = styled.div<{ tooLong: boolean }>`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme, tooLong }) => (tooLong ? theme.colors.danger : theme.colors.textTertiary)};
  text-align: right;
  margin-top: -4px;
`;

export const ImageDrop = styled.div`
  border: 2px dashed ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.bgSoft};

  &:hover,
  &:focus-visible {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
  }
`;

export const ImagePreview = styled.img`
  max-width: 100%;
  max-height: 200px;
  border-radius: ${({ theme }) => theme.radius.sm};
`;

export const ImageInfo = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const InlineError = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.danger};
`;
