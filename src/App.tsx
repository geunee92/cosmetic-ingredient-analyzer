import { Global, ThemeProvider } from '@emotion/react';
import { theme } from '@/styles/theme';
import { globalStyles } from '@/styles/globals';
import { MobileFrame } from '@/components/common/MobileFrame';
import { AnalyzerView } from '@/views/analyzer';

export const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Global styles={globalStyles} />
      <MobileFrame>
        <AnalyzerView />
      </MobileFrame>
    </ThemeProvider>
  );
};
