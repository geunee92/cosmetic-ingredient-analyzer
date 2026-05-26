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

  /* 키보드 포커스 가시화 — 마우스 클릭 시에는 표시 X */
  :focus {
    outline: none;
  }
  :focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
    border-radius: ${theme.radius.sm};
  }

  /* 스크린리더 전용 텍스트 */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;
