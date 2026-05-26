/**
 * 디자인 토큰 — 모든 컴포넌트 스타일이 참조.
 *
 * 화장품/뷰티 톤이지만 과한 컬러는 피하고 깔끔하게.
 * 메인 액션은 보라(primary), 규제 상태별로만 의미 컬러.
 */

export const theme = {
  colors: {
    bg: '#ffffff',
    bgSoft: '#fafafa',
    bgFrame: '#eef0f5', // PC에서 모바일 프레임 밖 배경
    text: '#1a1a1a',
    textSecondary: '#666',
    textTertiary: '#999',
    border: '#e5e5e5',
    borderStrong: '#cfd2d8',
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryDisabled: '#c4b5fd',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    cardBg: '#ffffff',
    cardShadow: '0 1px 3px rgba(0,0,0,0.05)',
    // 규제 상태별
    statusAllowed: '#10b981',
    statusRestricted: '#f59e0b',
    statusBanned: '#ef4444',
    statusUnknown: '#9ca3af',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    pill: '999px',
  },
  font: {
    family:
      '"Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Helvetica Neue", sans-serif',
    sizes: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  layout: {
    mobileMaxWidth: '420px',
    pagePadding: '16px',
  },
} as const;

export type AppTheme = typeof theme;
