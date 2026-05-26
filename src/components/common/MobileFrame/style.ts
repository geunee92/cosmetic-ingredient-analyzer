import styled from '@emotion/styled';

export const Frame = styled.main`
  width: 100%;
  max-width: ${({ theme }) => theme.layout.mobileMaxWidth};
  min-height: 100vh;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.bg};
  display: flex;
  flex-direction: column;
  /* PC에서 좌우 그림자로 모바일 프레임 가시화 */
  box-shadow:
    -1px 0 0 ${({ theme }) => theme.colors.border},
    1px 0 0 ${({ theme }) => theme.colors.border};
`;
