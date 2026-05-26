/**
 * MobileFrame — PC에서 모바일뷰를 화면 가운데에 표시.
 *
 * - 모바일 (≤ mobileMaxWidth): 전체 화면 사용
 * - PC (> mobileMaxWidth): max-width로 제한 + 가운데 정렬 + 회색 배경
 *
 * SPEC.md §3.1 레이아웃 원칙.
 */

import type { ReactNode } from 'react';
import { Frame } from './style';

type Props = {
  children: ReactNode;
};

export const MobileFrame = ({ children }: Props) => {
  return <Frame>{children}</Frame>;
};
