/**
 * DataMapEditor — Storybook stories (CSF3, placeholder).
 *
 * Storybook 인프라(@storybook/react-vite)는 MOD-GRID-99-B에서 도입 예정.
 * 본 파일은 CSF3 컨벤션 (Meta default export + named Story exports)만 유지하여
 * 인프라 도입 시 무수정 가용. 타입 import만 — tsc strict 통과 보장.
 *
 * AC-008: DataMapEditor Storybook story 2개 (정적 DataMap + getLabelFromItem 시나리오).
 * G-003/MOD-GRID-12 deliverable.
 *
 * @see Spec MOD-GRID-12/G-003 Section 13.4 (AC-008 의무)
 * @see Spec MOD-GRID-12/G-003 Section 3.1 (DataMapEditorProps API)
 * @see precedent: packages/grid-pro-datamap/src/__stories__/DataMapCell.stories.tsx
 */
import { DataMapEditor } from '../DataMapEditor.js';

const meta = {
  title: 'Pro/DataMapEditor',
  component: DataMapEditor,
  parameters: { layout: 'centered' },
} as const;

export default meta;

/**
 * 시나리오 1: 정적 DataMap — 상태코드 편집 드롭다운 (AC-001~AC-006).
 *
 * statusCode 'ACTIVE'/'INACTIVE'/'PENDING' 목록을 필터-타이핑으로 검색.
 * - 마운트 시 input 자동 포커스 (AC-001)
 * - 타이핑 → label 기준 대소문자 무관 필터 (AC-002)
 * - 드롭다운 z-50 스타일 (AC-003)
 * - ArrowDown/Up/Enter/Escape 키보드 (AC-004)
 * - ARIA combobox/listbox/option (AC-006)
 *
 * @see Spec MOD-GRID-12/G-003 Section 13.4 (시나리오 1)
 */
export const StaticDataMapEditor = {
  args: {
    scenario: 'static-datamap-editor',
    description: 'DataMapEditor with createDataMap({ items: statusItems, valuePath: "code", displayPath: "label" })',
    initialValue: 'ACTIVE',
    getLabelFromItem: '(item: StatusItem) => item.label',
    dataMapItems: [
      { code: 'ACTIVE', label: '활성' },
      { code: 'INACTIVE', label: '비활성' },
      { code: 'PENDING', label: '대기' },
    ],
    expectedBehavior: [
      '마운트 시 "활성" 표시 + input 포커스',
      '"비" 입력 시 "비활성"만 필터',
      'ArrowDown → "비활성" 하이라이트',
      'Enter → onCommit("INACTIVE") 호출',
      'Escape → onCancel() 호출',
    ],
    spec: 'MOD-GRID-12/G-003 Section 13.4 시나리오 1 + AC-001~AC-006',
  },
} as const;

/**
 * 시나리오 2: getLabelFromItem prop 명시 — F-06 수정 검증.
 *
 * DataMap 내부 Map이 valuePath(item) 코드 키로 저장되므로 getDisplay(item) 직접 호출 불가.
 * getLabelFromItem prop으로 item → label 변환 함수를 외부에서 주입하여 필터링 정상 동작.
 *
 * - getLabelFromItem 미제공 시 String(item) fallback (Section 11.3)
 * - getLabelFromItem 제공 시 반환 label로 필터 (F-06 fix)
 * - 객체 키 중복 없이 label 기준 필터 정상 동작 확인
 *
 * @see Spec MOD-GRID-12/G-003 Section 11.3 (getLabelFromItem explicit alternative)
 * @see F-06 spec code defect: Section 3.4 filter pattern 버그 수정
 */
export const GetLabelFromItemProp = {
  args: {
    scenario: 'get-label-from-item-prop',
    description: 'DataMapEditor with getLabelFromItem prop (F-06 fix — getDisplay(item) 대체)',
    initialValue: 'KR',
    getLabelFromItem: '(item: CountryItem) => item.name',
    dataMapItems: [
      { code: 'KR', name: '대한민국' },
      { code: 'US', name: '미국' },
      { code: 'JP', name: '일본' },
      { code: 'CN', name: '중국' },
    ],
    expectedBehavior: [
      '마운트 시 "대한민국" 표시 + input 포커스',
      '"미" 입력 시 "미국"만 필터 (getLabelFromItem 사용)',
      'getLabelFromItem 미제공 시 String(item) fallback → "[object Object]" 필터',
      'getLabelFromItem 제공 시 item.name 기준 필터 → 정상 동작',
    ],
    spec: 'MOD-GRID-12/G-003 Section 11.3 + F-06 specCodeDefect 수정',
  },
} as const;
