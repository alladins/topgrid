/**
 * MOD-GRID-99-B residual-4 — ADR-001 watermark visual regression (Wave 2)
 *
 * AggregationGrid + invalid license → `useLicenseStatus().watermarkRequired = true`
 * → `<Watermark required />` overlay 노출.
 *
 * D-A 채택 (사용자 결정): 7 Pro × invalid license stories — 옵션 P0.
 * baseline PNG 캡처는 별도 baseline-only PR (D-B + D-D) — CI ubuntu 환경.
 *
 * NOTE (path divergence): task 브리프 는 `src/__stories__/` 경로 명시했으나
 * 디스크 검증 결과 tsconfig `rootDir: "./src"` + `@storybook/react` 미설치 (per-package)
 * 로 인해 cross-package 임포트 차단 + Meta/StoryObj 타입 미해결. spec §5.1 의 `stories/`
 * 경로가 13 패키지 기존 컨벤션 — 본 파일 위치 채택. 결과 보고서에 명시.
 *
 * @see findings/wave-residual-4-storybook-99b-spec.md §3.1 (ADR-001 gap)
 * @see findings/wave2-adr-001-result.md (7 Pro wrapper watermark wiring)
 * @see ADR-MOD-GRID-REFACTOR-2026-05-17-001 (Visual Regression Note)
 */
import type { Meta, StoryObj } from '@storybook/react';
import { AggregationGrid } from '@topgrid/grid-pro-agg';
import type { AggregationColumnDef } from '@topgrid/grid-pro-agg';
import { setLicenseState } from '@topgrid/grid-license';

// LicenseState 구조 (internal — types.ts): { status: LicenseStatus, rawKey: string, setAt: number }
const invalidLicense = {
  status: { valid: false, reason: 'invalid' as const },
  rawKey: '',
  setAt: 0,
};

interface SalesRow {
  id: number;
  dept: string;
  product: string;
  sales: number;
}

const mockData: SalesRow[] = [
  { id: 1, dept: 'Engineering', product: 'Widget A', sales: 1200 },
  { id: 2, dept: 'Engineering', product: 'Widget B', sales: 800 },
  { id: 3, dept: 'Marketing', product: 'Widget C', sales: 600 },
  { id: 4, dept: 'Marketing', product: 'Widget D', sales: 900 },
];

const columns: AggregationColumnDef<SalesRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'dept', header: 'Department' },
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'sales', header: 'Sales', meta: { aggregationFn: 'sum' } },
];

const meta: Meta<typeof AggregationGrid> = {
  title: 'Pro/AggregationGrid/Watermark',
  component: AggregationGrid,
};
export default meta;
type Story = StoryObj<typeof AggregationGrid>;

/**
 * Invalid license → `<Watermark required />` overlay 시각 검증.
 *
 * ADR-001 Implementation Note: `AggregationGrid` wrapper inline `useLicenseStatus()`
 * 호출 + `{_lic.watermarkRequired && <Watermark required />}` overlay (2 returns —
 * virt path / non-virt path 둘 다).
 */
export const WithInvalidLicense: Story = {
  beforeEach: () => {
    setLicenseState(invalidLicense);
  },
  args: {
    data: mockData,
    columns,
    enableAggregation: true,
    grouping: ['dept'],
    expanded: true,
  },
};
