/**
 * MOD-GRID-99-B residual-4 — ADR-002 registry wiring visual regression (Wave 3)
 *
 * ADR-002 Implementation Note: `grid-renderers/src/wireRegistry.ts` 가
 * grid-core `defaultRendererRegistry` 의 6 슬롯 (`text` / `number` / `date` /
 * `dateTime` / `badge` / `link`) 을 어댑터로 등록 (side-effect).
 *
 * 본 story 는 cross-package wiring 통합 검증:
 *   - `import '@tomis/grid-renderers'` 만 해도 `createColumns()` 가 실 컴포넌트 렌더.
 *   - `TomisColumnDef.type` 문자열 ID → registry lookup → adapter → cell 컴포넌트.
 *
 * Wave 1 ADR-014 amendment v2 도 커버: LinkCell `value?` prop 사용 (label deprecated alias 보존).
 *
 * D-A 채택 (사용자 결정): 1 신규 story — Grid with registry renderers.
 * baseline PNG 캡처는 별도 baseline-only PR (D-B + D-D) — CI ubuntu 환경.
 *
 * @see findings/wave-residual-4-storybook-99b-spec.md §3.2 (ADR-002 gap)
 * @see findings/wave3-adr-002-result.md (6 슬롯 wiring)
 * @see ADR-MOD-GRID-REFACTOR-2026-05-17-002 (Visual Regression Note)
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Grid, createColumns } from '@tomis/grid-core';
import type { TomisColumnDef } from '@tomis/grid-core';
// side-effect: grid-renderers wireDefaultRenderers() 호출 (6 슬롯 어댑터 등록)
import '@tomis/grid-renderers';

interface ProductRow {
  id: number;
  name: string;
  price: number;
  releaseDate: string;
  status: string;
  detailsUrl: string;
}

const mockData: ProductRow[] = [
  { id: 1, name: 'Widget A', price: 12000, releaseDate: '2025-01-15', status: 'ACTIVE', detailsUrl: 'https://example.com/widget-a' },
  { id: 2, name: 'Widget B', price: 8500, releaseDate: '2024-11-03', status: 'PENDING', detailsUrl: 'https://example.com/widget-b' },
  { id: 3, name: 'Widget C', price: 15300, releaseDate: '2025-03-22', status: 'INACTIVE', detailsUrl: 'https://example.com/widget-c' },
  { id: 4, name: 'Widget D', price: 9750, releaseDate: '2025-02-08', status: 'ACTIVE', detailsUrl: 'https://example.com/widget-d' },
];

// TomisColumnDef.type 문자열 ID → registry lookup → adapter → cell 컴포넌트
const defs: TomisColumnDef<ProductRow>[] = [
  { id: 'id', name: 'ID', type: 'number', align: 'right', width: '60' },
  { id: 'name', name: 'Name', type: 'text', align: 'left', width: '150' },
  { id: 'price', name: 'Price', type: 'number', align: 'right', width: '100' },
  { id: 'releaseDate', name: 'Release', type: 'date', align: 'center', width: '120' },
  { id: 'status', name: 'Status', type: 'badge', align: 'center', width: '100' },
  { id: 'detailsUrl', name: 'Details', type: 'link', align: 'left', width: '200' },
];

const columns = createColumns<ProductRow>(defs);

const meta: Meta<typeof Grid> = {
  title: 'grid-core/Grid/WithRegistryRenderers',
  component: Grid,
};
export default meta;
type Story = StoryObj<typeof Grid>;

/**
 * Grid + registry renderers — ADR-002 6 슬롯 통합 시각 검증.
 *
 * Expected:
 *   - `number` 컬럼 (id, price) → NumberCell 어댑터 (우측 정렬 + locale)
 *   - `text` 컬럼 (name) → TextCell 어댑터 (좌측 정렬)
 *   - `date` 컬럼 (releaseDate) → DateCell 어댑터 (YYYY-MM-DD)
 *   - `badge` 컬럼 (status) → StatusBadgeCell 어댑터
 *   - `link` 컬럼 (detailsUrl) → LinkCell 어댑터 (`value` prop — ADR-014 amendment v2)
 */
export const Default: Story = {
  name: 'Registry renderers (text / number / date / badge / link)',
  args: {
    columns,
    data: mockData,
  },
};
