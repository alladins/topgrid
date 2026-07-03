/**
 * @topgrid/grid-pro-pivot-vue — pivot 도구 패널 (Vue 3)
 *
 * React `PivotPanel` 의 Vue 대응. Available / Rows / Columns / Values 4개 존에 필드를 배치하고,
 * 순수 {@link movePivotField} 로 존 간 이동한 새 config 를 `update:config` 로 emit 한다.
 * 렌더는 `h`(defineComponent). 로직은 프레임워크 무관 코어 재사용.
 *
 * ★License gate: @topgrid/grid-license-core(프레임워크 무관 — React peer 미유입)로 자동 게이트.
 * 유효 키 미등록 시 워터마크 표시(반응형). `watermark` prop 으로 강제 override.
 */
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, type PropType } from 'vue';
import { movePivotField, type PivotConfig, type PivotZone } from '@topgrid/grid-pro-pivot-core';
import { checkLicense, subscribeLicense } from '@topgrid/grid-license-core';

const ZONES: { zone: PivotZone; label: string }[] = [
  { zone: 'available', label: 'Available' },
  { zone: 'rows', label: 'Rows' },
  { zone: 'columns', label: 'Columns' },
  { zone: 'values', label: 'Values' },
];

/** config 에서 각 존에 속한 필드명 목록을 뽑는다. available = fields 중 미배정. */
function fieldsInZone(config: PivotConfig, allFields: string[], zone: PivotZone): string[] {
  if (zone === 'rows') return config.rows;
  if (zone === 'columns') return config.columns;
  if (zone === 'values') return config.values.map((v) => v.field);
  const assigned = new Set([...config.rows, ...config.columns, ...config.values.map((v) => v.field)]);
  return allFields.filter((f) => !assigned.has(f));
}

export const VuePivotPanel = defineComponent({
  name: 'TopGridVuePivotPanel',
  props: {
    /** 현재 피벗 구성. */
    config: { type: Object as PropType<PivotConfig>, required: true },
    /** 배치 가능한 전체 필드명(available 존 계산용). */
    fields: { type: Array as PropType<string[]>, required: true },
    /** 워터마크 override: 생략 → 라이선스 상태 자동 게이트; true/false → 강제. */
    watermark: { type: Boolean, default: undefined },
  },
  emits: {
    'update:config': (_config: PivotConfig) => true,
  },
  setup(props, { emit }) {
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

    const move = (field: string, toZone: PivotZone): void => {
      emit('update:config', movePivotField(props.config, field, toZone));
    };

    const onDrop = (ev: DragEvent, toZone: PivotZone): void => {
      ev.preventDefault();
      const field = ev.dataTransfer?.getData('text/plain');
      if (field) move(field, toZone);
    };

    return () =>
      h('div', { 'data-pivot-panel': '', style: { position: 'relative', display: 'flex', gap: '8px' } }, [
        ...ZONES.map(({ zone, label }) =>
          h(
            'div',
            {
              key: zone,
              'data-pivot-zone': zone,
              onDragover: (e: DragEvent) => e.preventDefault(),
              onDrop: (e: DragEvent) => onDrop(e, zone),
              style: { flex: '1', minHeight: '60px', border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px' },
            },
            [
              h('div', { style: { fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '2px' } }, label),
              ...fieldsInZone(props.config, props.fields, zone).map((field) =>
                h(
                  'div',
                  {
                    key: field,
                    'data-pivot-field': field,
                    draggable: 'true',
                    onDragstart: (e: DragEvent) => {
                      e.dataTransfer?.setData('text/plain', field);
                    },
                    style: { padding: '2px 6px', margin: '2px 0', background: '#f3f4f6', borderRadius: '3px', cursor: 'grab', fontSize: '12px' },
                  },
                  field,
                ),
              ),
            ],
          ),
        ),
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
