/**
 * Global CSS — emotion <Global>로 한 번만 마운트.
 *
 * 모바일 우선 + safe-area inset 고려 + 시스템 폰트 fallback.
 */

import { css } from '@emotion/react';
import { theme } from './theme';

export const globalStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    margin: 0;
    padding: 0;
    height: 100%;
    background: ${theme.colors.bgFrame};
    color: ${theme.colors.text};
    font-family: ${theme.font.family};
    font-size: ${theme.font.sizes.base};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }

  input,
  textarea {
    font-family: inherit;
  }

  /* iOS Safari 줌 인 방지 (16px 이상) */
  input,
  textarea,
  select {
    font-size: 16px;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
`;
