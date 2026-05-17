/**
 * NumberCell — Storybook stories (CSF3, placeholder).
 *
 * Storybook 인프라 도입 전 컨벤션만 유지. 타입 import 0.
 *
 * 시각 회귀 검증 시나리오 (spec EC-01~EC-03):
 * - decimals 변동 (0 / 2)
 * - colorNegative true (음수 red-600)
 * - null/undefined → dash
 * - NaN → dash (EC-02 의도된 deviation — L0 inline 은 "NaN" 출력했음)
 *
 * @see findings/auto-fixed/MOD-GRID-05-G-001-visual-regression.md Section 2.1
 * @see Spec MOD-GRID-05/G-001 Section 2.2 + EC-01/EC-02/EC-03
 */
import { NumberCell } from '../NumberCell.js';

const meta = {
  title: 'Cells/NumberCell',
  component: NumberCell,
  parameters: { layout: 'centered' },
} as const;

export default meta;

/** 기본 — decimals=0, locale='ko-KR' (천 단위 구분). */
export const Default = {
  args: { value: 1234567 },
} as const;

/** 소수점 2자리. */
export const TwoDecimals = {
  args: { value: 1234.5, decimals: 2 },
} as const;

/** 소수점 4자리. */
export const FourDecimals = {
  args: { value: 0.12345, decimals: 4 },
} as const;

/** 단위 접미사 — 원. */
export const WithUnitWon = {
  args: { value: 50000, unit: '원' },
} as const;

/** 단위 접미사 — % (소수 1자리). */
export const WithUnitPercent = {
  args: { value: 12.7, decimals: 1, unit: '%' },
} as const;

/** 음수 색상 — colorNegative=true → text-red-600. */
export const NegativeWithColor = {
  args: { value: -1234.56, decimals: 2, colorNegative: true },
} as const;

/** 음수이지만 colorNegative=false → 색 변경 없음. */
export const NegativeWithoutColor = {
  args: { value: -1234.56, decimals: 2, colorNegative: false },
} as const;

/** 0 — 정상 표시 ("0"). */
export const Zero = {
  args: { value: 0 },
} as const;

/** null — dash placeholder. */
export const NullValue = {
  args: { value: null },
} as const;

/** undefined — dash placeholder. */
export const UndefinedValue = {
  args: { value: undefined },
} as const;

/**
 * NaN (EC-02 의도된 deviation).
 * L0 의 inline value.toLocaleString 은 "NaN" 텍스트를 출력했음.
 * After (현재) 는 Number.isFinite 가드로 dash placeholder 렌더.
 * 운영 데이터에서 NaN 노출은 ~0 으로 risk-bound.
 */
export const NaNValue = {
  args: { value: Number.NaN },
} as const;

/** 외국 로케일 — en-US (comma 동일, 그러나 음수 표기는 가능 차이). */
export const UsLocale = {
  args: { value: 1234567.89, decimals: 2, locale: 'en-US' },
} as const;

/** 추가 className 합성 — 의미적 색상 토큰 결합 가능. */
export const WithClassName = {
  args: { value: 1234, className: 'font-bold' },
} as const;
