# @topgrid/grid-pro-serverside-vue

Vue 3 용 서버사이드 로우 모델(SSRM) + 뷰포트(push) 로우 모델. 프레임워크 무관
`@topgrid/grid-pro-serverside-core` 컨트롤러 재사용(React 와 동일 epoch 불변식·블록 캐시).
React 의존 0. 대용량 데이터 가상화 + 지연 블록 로딩.

```ts
import { useVueServerSideData, isRowPlaceholder, setLicenseKey } from '@topgrid/grid-pro-serverside-vue';

setLicenseKey('<라이선스 키>'); // 앱 entry 1회

const { data, totalCount, ensureRange, setSorting, refresh } =
  useVueServerSideData(datasource, { blockSize: 100, rowCount: 100000 });
// 가상화 라이브러리의 visible range → ensureRange(first, last)
// isRowPlaceholder(row) 로 로딩 스켈레톤 표시
```

컨트롤러는 client(onMounted)에서만 생성 → Nuxt SSR 안전(서버 렌더 단계엔 placeholder).
상용 라이선스(EULA). 미등록 시 소비 그리드 워터마크(기능은 동작).
