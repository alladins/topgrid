/**
 * TextCell — Storybook stories (CSF3, placeholder).
 *
 * Storybook 인프라(@storybook/react)는 MOD-GRID-99-B 에서 도입 예정.
 * 본 파일은 CSF3 컨벤션 (Meta default export + named Story exports) 만 유지하여
 * 인프라 도입 시 무수정 가용. 타입 import 0 — tsc strict 통과 보장.
 *
 * @see findings/auto-fixed/MOD-GRID-05-G-001-visual-regression.md
 * @see Spec MOD-GRID-05/G-001 Section 13.3 (Storybook story plan)
 */
import { TextCell } from '../TextCell.js';

const meta = {
  title: 'Cells/TextCell',
  component: TextCell,
  parameters: { layout: 'centered' },
} as const;

export default meta;

/** 일반 문자열 — 기본 사용. */
export const Default = {
  args: { value: 'Hello TOMIS' },
} as const;

/** 추가 className 합성 — 의미적 색상 토큰 결합 가능. */
export const WithClassName = {
  args: { value: '강조 텍스트', className: 'font-bold text-blue-600' },
} as const;

/** 숫자 입력 — 문자열로 변환 (toString). EC-06 falsy 0 보존. */
export const NumberInput = {
  args: { value: 42 },
} as const;

/** falsy 0 — "0" 표시 (dash 아님 — EC-06 정책). */
export const FalsyZero = {
  args: { value: 0 },
} as const;

/** null — dash placeholder (text-gray-400). */
export const NullValue = {
  args: { value: null },
} as const;

/** undefined — dash placeholder. */
export const UndefinedValue = {
  args: { value: undefined },
} as const;

/** empty string — dash placeholder. */
export const EmptyString = {
  args: { value: '' },
} as const;

/** 긴 텍스트 — 오버플로우 거동 확인 (현재 단순 span — wrap 처리는 사용처 column width 책임). */
export const LongText = {
  args: { value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.' },
} as const;
