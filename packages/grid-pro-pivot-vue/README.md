# @topgrid/grid-pro-pivot-vue

Vue 3 용 선언적 2차원 피벗. 프레임워크 무관 `@topgrid/grid-pro-pivot-core` 엔진을 재사용
(React `@topgrid/grid-pro-pivot` 과 동일 `computePivot`). React 의존 0.

```ts
import { useVuePivot, VuePivotPanel, setLicenseKey } from '@topgrid/grid-pro-pivot-vue';

setLicenseKey('<라이선스 키>'); // 앱 entry 1회

const data = ref(sales);
const config = ref({ rows: ['region'], columns: ['quarter'], values: [{ field: 'amt', aggregationFn: 'sum' }] });
const model = useVuePivot(data, config); // ComputedRef<PivotModel>
// template: v-for="row in model.rows" — 자유 렌더, 또는 <VuePivotPanel v-model:config="config" :fields="fields" />
```

상용 라이선스(EULA). 미등록 시 워터마크(기능은 동작).
