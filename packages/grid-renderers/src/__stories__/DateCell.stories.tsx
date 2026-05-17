/**
 * DateCell — Storybook stories (CSF3, placeholder).
 *
 * Storybook 인프라 도입 전 컨벤션만 유지. 타입 import 0.
 *
 * 시각 회귀 검증 시나리오 (spec EC-04/EC-05):
 * - format=date / datetime / time
 * - locale 변동 (ko-KR / en-US)
 * - null/undefined/'' → dash
 * - invalid date string → dash (EC-05 의도된 deviation — L0 inline 은 {value} 그대로 노출)
 *
 * @see findings/auto-fixed/MOD-GRID-05-G-001-visual-regression.md Section 2.2
 * @see Spec MOD-GRID-05/G-001 Section 2.3 + EC-04/EC-05
 */
import { DateCell } from '../DateCell.js';

const meta = {
  title: 'Cells/DateCell',
  component: DateCell,
  parameters: { layout: 'centered' },
} as const;

export default meta;

/** 기본 — format='date', locale='ko-KR'. */
export const Default = {
  args: { value: '2026-05-14' },
} as const;

/** format='datetime' — YYYY. MM. DD. HH:mm. */
export const DateTime = {
  args: { value: '2026-05-14T15:30:00', format: 'datetime' },
} as const;

/** format='time' — HH:mm:ss. */
export const TimeOnly = {
  args: { value: '2026-05-14T15:30:45', format: 'time' },
} as const;

/** Date 객체 입력. */
export const DateObject = {
  args: { value: new Date('2026-05-14T15:30:00'), format: 'datetime' },
} as const;

/** number 입력 (epoch ms). */
export const EpochMs = {
  args: { value: 1779000000000, format: 'datetime' },
} as const;

/** locale en-US — 다른 포맷. */
export const UsLocale = {
  args: { value: '2026-05-14', format: 'date', locale: 'en-US' },
} as const;

/** null — dash placeholder (EC-04). */
export const NullValue = {
  args: { value: null },
} as const;

/** undefined — dash placeholder. */
export const UndefinedValue = {
  args: { value: undefined },
} as const;

/** empty string — dash placeholder (EC-04). */
export const EmptyString = {
  args: { value: '' },
} as const;

/**
 * Invalid string (EC-05 의도된 deviation).
 * L0 의 try/catch 는 {String(value)} 그대로 노출 ("not-a-date" 텍스트가 화면에 표시됨).
 * After 는 formatter 가 '' 반환 → dash placeholder 일관 처리.
 * 운영 DB datetime 컬럼은 schema 보장 — invalid 노출 ~0 으로 risk-bound.
 */
export const InvalidString = {
  args: { value: 'not-a-date', format: 'date' },
} as const;

/** 추가 className 합성. */
export const WithClassName = {
  args: { value: '2026-05-14', className: 'font-mono' },
} as const;
