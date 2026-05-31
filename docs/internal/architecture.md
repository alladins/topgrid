# topgrid 아키텍처

topgrid 는 TanStack Table 위에 얇은 추상화를 올린 **상용 그리드 제품**이다.
하나의 모노레포 안에 13개 패키지로 분리되어 있고, MIT 무료 패키지와 Pro 유료
패키지가 한 라이선스 경계로 나뉜다. 이 문서는 개별 셀의 prop 계약(→
`modules/renderers.md`)이 아니라, **패키지 layering · 라이선스 게이트 · 레지스트리
와이어링 · 번들 예산 · cross-package 경계**, 그리고 그 결정을 떠받치는 설계 원칙을
시스템 관점에서 기술한다.

---

## 1. 패키지 layering

### 1.1 13개 패키지 구성

| 패키지 | 라이선스 | 역할 |
|--------|---------|------|
| `@topgrid/grid-core` | MIT | `<Grid>` 컴포넌트 + `createColumns` + 타입 + 영속화 hook. 추상화의 중심 |
| `@topgrid/grid-renderers` | MIT | 표시 셀 11종 + 편집 셀 1종 + 렌더러 레지스트리 |
| `@topgrid/grid-features` | MIT | 멀티 정렬 · 필터 UI 등 add-on 기능 |
| `@topgrid/grid-export` | MIT | Excel/PDF export |
| `@topgrid/grid` | meta | 13개 패키지 public API 를 한 진입점으로 모으는 facade |
| `@topgrid/grid-pro-agg` | Pro | 집계(aggregation) 그리드 |
| `@topgrid/grid-pro-datamap` | Pro | 코드↔라벨 매핑 셀 |
| `@topgrid/grid-pro-header` | Pro | 다단(multi-row) 헤더 |
| `@topgrid/grid-pro-master` | Pro | master-detail · context menu · row pinning |
| `@topgrid/grid-pro-merging` | Pro | body 셀 rowSpan 자동 병합 |
| `@topgrid/grid-pro-range` | Pro | 셀 범위 선택 · 클립보드 · 키보드 편집/내비 |
| `@topgrid/grid-pro-tracking` | Pro | 변경 추적(change tracking) 그리드 |
| `@topgrid/grid-license` | 독점(EULA) | 라이선스 키 검증 + 워터마크 enforcement. Pro 게이트의 기반 |

분류는 4 MIT + 1 meta + 8 Pro(7 기능 + 1 license)다. MIT 패키지만으로 완전한
그리드를 구성할 수 있고, Pro 패키지는 각자 단일 기능을 더하는 add-on 이다.

### 1.2 레이어 방향

```
                 grid-renderers ─┐
 grid-core  ◄──── grid-features  ├─ (모두 grid-core 에 peer 의존)
                 grid-pro-*     ─┘
                 grid-license  ◄── grid-pro-* (런타임 게이트)
                 grid (meta)   ──► 위 전부를 re-export
```

핵심 불변식: **grid-core 는 자신보다 위에 있는 어떤 패키지에도 의존하지 않는다.**
렌더러·기능·Pro 패키지가 grid-core 를 peer dependency 로 끌어다 쓰고, 그 반대는
없다. 과거 grid-core 가 일부 기능(column drag, sort clear) 구현을 외부 기능
패키지에서 import 하던 역방향 의존이 있었는데, 해당 구현을 grid-core 의 `internal/`
로 옮겨 의존 방향을 정상화했다(§5.1).

---

## 2. 라이선스 게이트

### 2.1 설계 의도 — 컴파일타임이 아닌 런타임 enforcement

Pro/MIT 경계는 패키지 분리(어떤 패키지를 설치·import 했는가)만으로는 강제되지
않는다. **유효 라이선스 없이 Pro 기능을 쓰면 런타임에 워터마크가 자동으로 보여야**
경계가 실효성을 갖는다. 따라서 게이트는 모듈 로드 side-effect 호출의 반환값을 버리는
방식이 아니라, 각 Pro 컴포넌트가 라이선스 상태를 **구독**하고 invalid 일 때 워터마크를
같은 트리에 렌더하도록 설계되었다.

### 2.2 grid-license 의 표면

- `setLicenseKey(key)` — 라이선스 키 주입.
- `checkLicense()` — 현재 키 검증 결과(`LicenseCheckResult`: `valid`,
  `watermarkRequired`) 반환.
- `useLicenseStatus()` — `useSyncExternalStore` 기반 React hook. 컴포넌트가
  라이선스 상태 변화를 구독한다.
- `useWatermarkEnforcement()` — void hook. 모듈 레벨 singleton 포털을 ref-count 로
  관리하여, 셀이 여러 개 활성화돼도 워터마크 포털을 정확히 1회만 mount 한다.
- `subscribeLicense(listener)` — 외부 상태 구독 등록.
- `Watermark` — 워터마크 컴포넌트.

### 2.3 enforcement granularity — 패키지 단위

워터마크는 **셀 단위가 아니라 패키지 단위로 1회** 렌더한다. 각 Pro 그리드 컴포넌트가
invalid 상태일 때 `<Watermark required />` 를 한 번 띄운다. 컴포넌트의 DOM 구조에
따라 두 가지 특수 패턴이 필요하다.

- **다단 헤더(grid-pro-header)** — 임의의 `<div>` 오버레이는 테이블 헤더 구조를
  깨므로, `<thead>` 안에 `<tr><th colSpan=N><Watermark/></th></tr>` 한 행을 prepend
  한다. HTML-valid 하고 포털이 필요 없으며, sticky 헤더일 때 워터마크 행도 함께
  sticky 처리한다.
- **DataMap 셀(grid-pro-datamap)** — 셀별 렌더러라 셀마다 오버레이를 쌓으면 포털이
  중첩된다. `useWatermarkEnforcement()` void hook 으로 `document.body` 에 singleton
  포털을 ref-count mount 하여, 수백 개 셀이 활성화돼도 워터마크는 1개만 뜨고 마지막
  unmount 시 정리된다.

### 2.4 설계 원칙 — 게이트의 default 동작

invalid 라이선스가 컴포넌트 렌더 자체를 차단(throw/null)하면 개발 중 화면이 백색이
되어 DX 가 나빠진다. 그래서 default 는 **렌더는 유지하되 워터마크를 노출**하는 쪽이다.
더 강한 enforcement(렌더 차단, 환경별 분기)는 별도 정책으로 남겨 두고, 기본 제품
동작은 "기능은 동작하나 워터마크가 보인다"로 둔다.

---

## 3. 레지스트리 wiring (type → 셀 디스패치)

### 3.1 두 레지스트리와 그 경계

- **grid-core** 는 `TomisColumnType` 키 기반의 placeholder 레지스트리를 가진다. 모든
  타입이 기본적으로 `String(value)` 텍스트를 반환한다. grid-renderers 를 import 하지
  않아도 `<Grid>` 가 깨지지 않게 하는 **graceful fallback** 이다.
- **grid-renderers** 는 실제 React 셀 컴포넌트 레지스트리(`defaultRendererRegistry`,
  `registerRenderer`, `getRenderer`)를 가진다. 이쪽이 셀 컴포넌트의 canonical
  소스다.

`createColumns`(grid-core)는 자기 패키지의 type-keyed 레지스트리만 조회한다. 따라서
실제 셀로 디스패치되려면 grid-renderers 의 컴포넌트가 grid-core 레지스트리에
**주입**되어야 한다.

### 3.2 side-effect 와이어링

`@topgrid/grid-renderers` 를 import 하면 side-effect 로 `wireDefaultRenderers()` 가
실행되어 grid-core 레지스트리의 일부 슬롯을 실제 셀 어댑터로 교체한다. 이를 위해
grid-renderers 는 grid-core 를 peer dependency 로 선언하고, 패키지의 `sideEffects`
필드에 진입점을 명시해 tree-shaking 이 이 wiring 을 제거하지 못하게 한다.

와이어되는 타입(8): `text` · `number` · `date` · `dateTime` · `badge` · `link` ·
`tag` · `progress`. 어댑터는 `value` 만 받는 셀을
`(cellContext) => createElement(Cell, { value })` 형태로 감싼다.

### 3.3 load-bearing 설계 지식 — value 어댑터 가능/불가능의 구분

레지스트리는 본질적으로 **value → 컴포넌트** 디스패치다. 따라서 `value` 외에 필수
prop 이 있는 셀은 value-only 어댑터로 만들 수 없다. 이 구분이 어떤 타입을 와이어하고
어떤 타입을 제외하는지를 결정한다.

| 분류 | 셀/타입 | 처리 |
|------|---------|------|
| value 어댑터 친화 | text, number, date, dateTime, badge, link, tag, progress | 레지스트리에 와이어(zero-config) |
| 구조적 차단 | `icon`(`icon: ReactNode` 필수) · `button`(`onClick` 필수) · `avatar`(`name` 필수) | 레지스트리 제외 — `column.cell` 직접 wiring |
| 그 외 | `boolean`(grid-core 기본 Y/N 유지) · `checkbox`(createColumns 의 DisplayColumnDef 분기로 우회) | 레지스트리 우회 |
| alias | `statusBadge`(=badge) · `check`(=checkbox) | grid-renderers 자체 레지스트리에만 존재. grid-core type 맵에는 동의어라 미추가 |

`icon`/`button`/`avatar` 를 무리하게 와이어하면 widening cast 로 컴파일은 통과하지만
런타임에 필수 prop 이 `undefined` 가 되어 깨진다(클릭 시 TypeError, 이니셜 `?`,
아이콘 미표시). **거짓 약속을 만드느니 레지스트리 밖에서 명시 wiring 하게 두는 것이
정직하다**는 원칙이다. 사용자는 이 셋을 쓸 때 `column.cell` 로 직접 연결한다.

> `createColumns` 가 type 으로 셀을 매핑하는 경로와, `column.cell` 에 셀 컴포넌트를
> 직접 쓰는 경로 둘 다 1급 시민이다. 전자는 zero-config 편의, 후자는 임의 prop 이
> 필요한 셀의 탈출구다.

---

## 4. 번들 예산

각 패키지는 brotli 압축 기준 KB 한도를 가지며 size-limit 로 측정·CI 게이트한다.

| 패키지 | 한도(brotli) |
|--------|------|
| grid-core | 30 KB |
| grid-renderers | 12 KB |
| grid-features / grid-export / 각 Pro 패키지 | 20 KB |
| grid (meta) | 150 KB |

### 4.1 측정 정확성 — ignore 정책의 일관화

번들 측정의 신뢰성은 **peer/외부 의존을 측정에서 빼는 것**에 달려 있다. peer 가
번들에 합산되면(react ≈ 140 KB 등) 패키지 한도는 무의미해진다. 그래서 모든 패키지가
동일한 baseline ignore 를 적용한다.

- **공통 peer**: `react`, `react-dom`, `@tanstack/react-table`,
  `@tanstack/react-virtual`.
- **조건부 peer**: `date-fns` 계열·`react-datepicker`(grid-features), `xlsx`·`jspdf`
  (grid-export) 등 해당 패키지가 실제 쓰는 것만.
- **cross-package workspace dep**: 패키지가 의존하는 `@topgrid/grid-*` 도 ignore
  (예: grid-pro-tracking 은 `@topgrid/grid-core` ignore).

### 4.2 설계 원칙 — 추정 금지, 실측

셀/기능 추가 시 번들 영향은 이전 작업에서 외삽하지 않고 **추가 직후 size-limit 로
실측**한다. 한도에 여유(≈20% 이상)를 두어, 후속 기능이 한도를 침범할 때 한도 상향이
무분별하게 일어나지 않게 한다. 셀의 런타임 부피가 작은 이유는 (1) Tailwind 클래스가
소스에 문자열 리터럴로만 존재해 런타임 부피 0, (2) 작은 순수 헬퍼만 사용, (3)
tree-shaking 으로 소비처별 fragment 가능이다.

---

## 5. cross-package 경계

### 5.1 의존 방향 규칙

- **grid-core 는 grid-features 에 의존하지 않는다.** grid-core 가 필요로 하는
  내부 기능(column drag, sort clear button, sort badge)은 grid-core 의 `internal/`
  에 있고, grid-features 는 그것들을 public alias 로 re-export 한다. 즉 public
  노출 위치는 grid-features 지만, 구현·소유는 grid-core 다.
- **renderers / features / Pro 패키지는 grid-core 를 peer dependency 로** 둔다.
  hard dependency 가 아니라 peer 이므로 버전이 step-lock 되지 않는다.
- **MIT 패키지는 Pro·license 패키지를 import 하지 않는다.** 라이선스 경계가
  소스 레벨에서 단방향(Pro/license → grid-core 방향만 허용)으로 유지된다.

### 5.2 단일 소스 원칙 — 중복 구현 통합

같은 모델/구현이 두 곳에 사는 것을 피한다. 다음 패턴으로 통합한다.

- **공유 타입은 한 곳에서 정의하고 re-export 한다.** 페이지·앱 측이 그리드 옵션
  타입(`GridPaginationOptions`, `GridRowSelectionOptions<TData>`, `BaseGridProps`
  등)을 자체 재정의하면 시그니처가 어긋난다(예: `(rows: TData[])` vs
  `(rows: unknown[])`). canonical 정의는 grid-core 에 두고 소비처는 re-export 만
  한다. `CellClassNameCallback<TData>` 도 grid-core 가 canonical, grid-renderers 는
  type-only re-export 다.
- **콜백 시그니처를 패키지 전반에서 통일한다.** 예: `onRowClick` 은 어디서나
  `(row: TData, event: MouseEvent<HTMLTableRowElement>) => void`. 넓은(event 포함)
  시그니처로 통일하면 인자 1개 콜백도 contravariance 로 그대로 호환되어 cast 비용이
  0 이 된다.
- **localStorage 영속화 패턴은 단일 어댑터로**. SSR 가드 + try/catch +
  JSON.parse + QuotaExceededError 처리가 여러 hook 에 반복되던 것을 grid-core 의
  `internal/storage` 헬퍼 세트(`getStorage`/`readJson`/`writeJson`/…)로 모아, 버그
  수정 지점을 1곳으로 줄였다. 이 어댑터는 `@internal` 로 표시되어 외부 public
  표면이 아니다.

### 5.3 meta facade 의 충돌 회피

`@topgrid/grid` 는 13개 패키지의 public API 를 한 진입점으로 모은다. 단순
`export *` 를 중첩하면 동일 식별자가 여러 패키지에서 나와 충돌(TS2308)한다. 그래서
충돌 식별자는 **명시(named) re-export 로 canonical 소스를 한 곳으로 고정**한다.

| 식별자 | canonical 소스 | 이유 |
|--------|---------------|------|
| `defaultRendererRegistry` / `registerRenderer` | grid-renderers | grid-core 의 것은 fallback placeholder |
| `TomisColumnDef`(타입) | grid-core | grid-pro-datamap 의 동명은 deprecation alias |
| `GroupedHeaderGrid` / `GroupedHeaderGridProps` | grid-pro-header | grid-core 의 legacy alias 는 thin wrapper |

`@deprecated` 로 표시된 API 는 facade 에서 제외하여 신규 사용자가 dead 표면에
진입하지 못하게 한다. facade 는 side-effect 로 grid-renderers 를 import 하여
레지스트리 wiring(§3.2)도 보존한다.

### 5.4 export API 의 듀얼 엔트리 패턴

소비처마다 데이터 모델이 다를 때, 한 entry 를 깨는 대신 **평행 entry 를 추가**한다.
예를 들어 export 패키지는 TanStack `Table<TData>` 인스턴스 기반 entry 와, 행 배열 +
컬럼 정의(`exportRowsToExcel(rows, columns, options?)`) 기반 entry 를 모두 제공한다.
기존 호출자를 건드리지 않으면서 다른 데이터 형태의 신규 호출자를 받는다.

---

## 6. 발견된 설계 원칙 (요약)

제품 전반에 반복적으로 적용되는, 재사용 가능한 원칙들이다.

1. **경계는 런타임에 강제될 때만 실효성을 갖는다.** 라이선스 게이트를 컴파일타임
   side-effect 가 아닌 구독+워터마크 렌더로 설계한 이유(§2).
2. **graceful fallback + side-effect 주입.** 의존을 추가하지 않아도 동작하는 기본값
   (placeholder)을 두고, 선택적 패키지를 import 하면 실제 구현이 주입되는 패턴(§3).
3. **추상화 가능한 것만 추상화한다 — 거짓 약속 금지.** value 어댑터로 만들 수 없는
   셀은 레지스트리에 억지로 넣지 않고 명시 wiring 경로를 남긴다(§3.3).
4. **단일 소스, 단일 수정 지점.** 타입·콜백·영속화 로직의 중복을 re-export/어댑터로
   통합하여 drift 와 다중 수정 부담을 제거한다(§5.2).
5. **의존 방향은 한 방향으로 고정한다.** grid-core 는 위 레이어를 모르고, MIT 는
   Pro/license 를 모른다(§5.1).
6. **측정은 추정하지 않고 실측한다.** 번들 예산은 일관된 ignore baseline 위에서
   실측·CI 게이트한다(§4).
7. **호환은 넓은 시그니처로 흡수한다.** 콜백·entry 를 넓게 통일하면 좁은 사용처가
   별도 cast 없이 그대로 호환된다(§5.2, §5.4).

---

## 부록 — 이 문서가 다루지 않는 것

- **각 셀의 prop 계약·엣지 케이스**: `modules/renderers.md` 참고.
- **개별 Pro 기능 모듈의 상세 API**: `modules/mod-grid-*.md` 참고.
- 이 문서는 시스템·패키지 관점에 한정하며, 컴포넌트 단위 사용법은 모듈 문서가
  담당한다.
