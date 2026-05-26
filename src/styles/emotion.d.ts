import '@emotion/react';
import type { AppTheme } from './theme';

declare module '@emotion/react' {
  // Theme augmentation: emotion이 styled의 props.theme 타입을 AppTheme로 추론
  export type Theme = AppTheme;
}
