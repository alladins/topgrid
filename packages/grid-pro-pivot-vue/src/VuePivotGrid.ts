/**
 * @topgrid/grid-pro-pivot-vue — 피벗 그리드 렌더 셸 (Vue 3)
 *
 * React `PivotGrid` 의 Vue 대응(편의 렌더 셸). data(rows)+config 로부터 {@link useVuePivot} 모델을
 * 계산 → {@link buildVuePivotColumns} 로 vue-table 컬럼 파생 → @tanstack/vue-table `useVueTable` 로
 * 다단 헤더 + 셀 렌더. 정렬/collapse 등 상호작용은 컴포저블로 배선(이 셸은 표시 담당).
 *
 * ★License gate: grid-license-core(프레임워크 무관)로 자동 게이트 + prop override.
 */
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, type PropType } from 'vue';
import { FlexRender, useVueTable, getCoreRowModel } from '@tanstack/vue-table';
import { computePivot, type PivotConfig, type PivotRow } from '@topgrid/grid-pro-pivot-core';
import { checkLicense, subscribeLicense } from '@topgrid/grid-license-core';
import { buildVuePivotColumns } from './buildVuePivotColumns.js';

type Row = Record<string, unknown>;

export const VuePivotGrid = defineComponent({
  name: 'TopGridVuePivotGrid',
  props: {
    /** flat 소스 행. */
    data: { type: Array as PropType<Row[]>, required: true },
    /** 피벗 구성(행/열 차원 + 값 정의). */
    config: { type: Object as PropType<PivotConfig>, required: true },
    /** 워터마크 override: 생략 → 라이선스 상태 자동 게이트; true/false → 강제. */
    watermark: { type: Boolean, default: undefined },
  },
  setup(props) {
    const model = computed(() => computePivot(props.data, props.config));
    const columns = computed(() => buildVuePivotColumns(model.value));

    const table = useVueTable<PivotRow>({
      get data() {
        return model.value.rows;
      },
      get columns() {
        return columns.value;
      },
      getCoreRowModel: getCoreRowModel(),
    });

    // 라이선스 자동 게이트(반응형)
    const autoWatermark = ref(checkLicense().watermarkRequired);
    let unsub: (() => void) | undefined;
    onMounted(() => {
      unsub = subscribeLicense(() => {
        autoWatermark.value = checkLicense().watermarkRequired;
      });
    });
    onBeforeUnmount(() => unsub?.());
    const showWatermark = computed(() =>
      props.watermark === undefined ? autoWatermark.value : props.watermark,
    );

    return () =>
      h('div', { 'data-pivot-grid': '', style: { position: 'relative' } }, [
        h('table', { 'data-topgrid-pivot': '' }, [
          h(
            'thead',
            table.getHeaderGroups().map((hg) =>
              h(
                'tr',
                hg.headers.map((header) => {
                  const label = header.column.columnDef.header;
                  const content =
                    typeof label === 'function'
                      ? h(FlexRender, { render: label, props: header.getContext() })
                      : (label ?? '');
                  return h(
                    'th',
                    {
                      'data-col': header.column.id,
                      colspan: header.colSpan > 1 ? header.colSpan : undefined,
                    },
                    [content],
                  );
                }),
              ),
            ),
          ),
          h(
            'tbody',
            table.getRowModel().rows.map((row) =>
              h(
                'tr',
                { 'data-row-kind': (row.original as PivotRow).__kind },
                row.getVisibleCells().map((cell) => {
                  const cdef = cell.column.columnDef.cell;
                  return h('td', { 'data-col': cell.column.id }, [
                    cdef
                      ? h(FlexRender, { render: cdef, props: cell.getContext() })
                      : String(cell.getValue() ?? ''),
                  ]);
                }),
              ),
            ),
          ),
        ]),
        showWatermark.value
          ? h(
              'div',
              {
                'data-watermark': '',
                style: { position: 'absolute', top: 0, right: 0, opacity: 0.4, fontSize: '12px', color: '#6b7280' },
              },
              'Unlicensed @topgrid/grid',
            )
          : null,
      ]);
  },
});
