import {
  defineComponent,
  h,
  ref,
  onMounted,
  onBeforeUnmount,
  type PropType,
  type CSSProperties,
} from 'vue';
import type { Table } from '@tanstack/table-core';
import type { ExportScope } from '@topgrid/grid-export';
import { useVueGridExport } from './useVueGridExport';

/** 버튼이 노출하는 내보내기 포맷 */
export type VueExportFormat = 'xlsx' | 'csv' | 'pdf' | 'clipboard' | 'print';

const LABELS = {
  ko: { download: '다운로드', xlsx: 'Excel', csv: 'CSV', pdf: 'PDF', clipboard: '클립보드 복사', print: '인쇄', empty: '내보낼 데이터 없음' },
  en: { download: 'Download', xlsx: 'Excel', csv: 'CSV', pdf: 'PDF', clipboard: 'Copy', print: 'Print', empty: 'No data to export' },
} as const;

// 파일명에서 알려진 확장자를 떼어 base 로 — 각 export 함수가 포맷에 맞는 확장자를 붙인다.
function stripExt(name?: string): string | undefined {
  if (!name) return undefined;
  return name.replace(/\.(xlsx|csv|pdf)$/i, '');
}

// CSS 시스템 색 — 라이트/다크 자동 대응(별도 CSS 불필요).
const btnStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
  font: 'inherit', fontSize: '14px', lineHeight: '1.2',
  border: '1px solid ButtonBorder', borderRadius: '6px',
  background: 'ButtonFace', color: 'ButtonText', cursor: 'pointer',
};
const menuStyle: CSSProperties = {
  position: 'absolute', top: '100%', left: '0', marginTop: '4px', minWidth: '160px', padding: '4px',
  background: 'Canvas', color: 'CanvasText', border: '1px solid ButtonBorder', borderRadius: '6px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, listStyle: 'none',
};

/**
 * Vue 3 내보내기 컨트롤. React `GridExportButton` 의 평행. formats 1개=단일 버튼, 2개+=드롭다운.
 * 빈 데이터면 비활성화, 대용량(scope='all')이면 확인 후 진행. 스타일은 시스템 색 인라인(라이트/다크 대응).
 *
 * @example
 * <VueGridExportButton :table="table" :formats="['xlsx','csv']" file-name="주문목록" />
 */
export const VueGridExportButton = defineComponent({
  name: 'VueGridExportButton',
  props: {
    table: { type: Object as PropType<Table<Record<string, unknown>>>, required: true },
    formats: { type: Array as PropType<VueExportFormat[]>, default: () => ['xlsx'] },
    scope: { type: String as PropType<ExportScope>, default: 'filtered' },
    fileName: { type: String as PropType<string | undefined>, default: undefined },
    columnFormats: { type: Object as PropType<Record<string, string> | undefined>, default: undefined },
    columnWidths: { type: Object as PropType<Record<string, number> | undefined>, default: undefined },
    label: { type: String as PropType<string | undefined>, default: undefined },
    locale: { type: String as PropType<'ko' | 'en'>, default: 'ko' },
    largeRowThreshold: { type: Number, default: 10000 },
  },
  emits: ['exported'],
  setup(props, { emit }) {
    const open = ref(false);
    const hovered = ref(-1);
    const rootRef = ref<HTMLElement | null>(null);

    const onDocDown = (e: MouseEvent) => {
      if (rootRef.value && !rootRef.value.contains(e.target as Node)) open.value = false;
    };
    onMounted(() => document.addEventListener('mousedown', onDocDown));
    onBeforeUnmount(() => document.removeEventListener('mousedown', onDocDown));

    function run(fmt: VueExportFormat) {
      const ex = useVueGridExport(props.table);
      const scope = props.scope;
      if ((fmt === 'xlsx' || fmt === 'csv' || fmt === 'pdf') && scope === 'all') {
        const n = ex.rowCount('all');
        if (n > props.largeRowThreshold) {
          const msg = props.locale === 'en'
            ? `Exporting ${n.toLocaleString()} rows may freeze the page briefly. Continue?`
            : `${n.toLocaleString()}행을 내보냅니다. 잠시 멈출 수 있습니다. 계속할까요?`;
          if (!window.confirm(msg)) return;
        }
      }
      const base = stripExt(props.fileName);
      const fileNameOpt = base !== undefined ? { fileName: base } : {};
      switch (fmt) {
        case 'xlsx':
          ex.toExcel({
            scope,
            ...fileNameOpt,
            ...(props.columnFormats ? { columnFormats: props.columnFormats } : {}),
            ...(props.columnWidths ? { columnWidths: props.columnWidths } : {}),
          });
          break;
        case 'csv': ex.toCsv({ scope, ...fileNameOpt }); break;
        case 'pdf': ex.toPdf({ scope, ...fileNameOpt }); break;
        case 'clipboard': ex.copy({ scope }); break;
        case 'print': ex.print({ scope }); break;
      }
      open.value = false;
      emit('exported', fmt);
    }

    return () => {
      const t = LABELS[props.locale] ?? LABELS.ko;
      const empty = useVueGridExport(props.table).isEmpty(props.scope);

      const icon = h('span', { 'aria-hidden': 'true', style: { fontSize: '13px' } }, '⭳');

      // 단일 포맷 → 단일 버튼
      if (props.formats.length === 1) {
        const fmt = props.formats[0]!;
        return h(
          'button',
          {
            type: 'button', style: btnStyle, disabled: empty,
            title: empty ? t.empty : undefined,
            'aria-label': `${t.download} ${t[fmt]}`,
            onClick: () => run(fmt),
          },
          [icon, ' ', props.label ?? t[fmt]],
        );
      }

      // 다중 포맷 → 드롭다운
      return h('div', { ref: rootRef, style: { position: 'relative', display: 'inline-block' } }, [
        h(
          'button',
          {
            type: 'button', style: btnStyle, disabled: empty,
            title: empty ? t.empty : undefined,
            'aria-haspopup': 'menu', 'aria-expanded': String(open.value),
            onClick: () => { open.value = !open.value; },
          },
          [icon, ' ', props.label ?? t.download, h('span', { 'aria-hidden': 'true', style: { fontSize: '10px' } }, ' ▾')],
        ),
        open.value
          ? h(
              'ul',
              { role: 'menu', style: menuStyle },
              props.formats.map((fmt, i) =>
                h('li', { key: fmt, role: 'none' }, [
                  h(
                    'button',
                    {
                      type: 'button', role: 'menuitem',
                      onClick: () => run(fmt),
                      onMouseenter: () => { hovered.value = i; },
                      onMouseleave: () => { hovered.value = -1; },
                      style: {
                        display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px',
                        font: 'inherit', fontSize: '14px', border: 'none', borderRadius: '4px',
                        background: hovered.value === i ? 'Highlight' : 'transparent',
                        color: hovered.value === i ? 'HighlightText' : 'inherit', cursor: 'pointer',
                      },
                    },
                    t[fmt],
                  ),
                ]),
              ),
            )
          : null,
      ]);
    };
  },
});
