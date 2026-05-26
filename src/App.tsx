import { Global, ThemeProvider } from '@emotion/react';
import { theme } from '@/styles/theme';
import { globalStyles } from '@/styles/globals';
import { MobileFrame } from '@/components/common/MobileFrame';

export const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Global styles={globalStyles} />
      <MobileFrame>
        <div style={{ padding: 16 }}>화장품 성분 분석기 (UI 작업 진행 중)</div>
      </MobileFrame>
    </ThemeProvider>
  );
};
