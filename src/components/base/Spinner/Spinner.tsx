/**
 * 로딩 인디케이터 — 단순 회전 원.
 * size로 px 크기 조정. aria-label로 접근성 라벨 노출.
 */

import { SpinnerRing } from './style';

type Props = {
  size?: number; // px
  label?: string;
};

export const Spinner = ({ size = 20, label = '로딩 중' }: Props) => {
  return <SpinnerRing size={size} role="status" aria-label={label} />;
};
