# 사용처 마이그레이션 모듈 (MOD-GRID-17)

> **이 모듈은 주로 프로세스 부기다.** 재사용 가능한 그리드 제품 지식은 거의 없으며,
> 6개 Goal 전부가 "기존 사용처를 레거시 호환 alias에서 표준 `<Grid>` API로 교체"하는
> 일회성 채택 작업이다. 아래에 그 작업의 *유일하게 의미 있는 제품 지식* 한 가지만
> product-neutral하게 남긴다. 나머지(페이지별 교체 추적, 점수/검증 기록 등)는 본 제품
> 문서의 대상이 아니다.

- 패키지 대상: 변경 없음 (사용처 코드만 수정 — `@topgrid/grid-*` 코어 변경 0건).
- 라이선스: 해당 없음 (MIT 영역의 `@topgrid/grid-core` `<Grid>`만 사용).

---

## 1. 이 모듈이 다루는 것

레거시 코드베이스가 그리드를 그릴 때 쓰던 **얇은 호환 래퍼**(`BaseGrid` 등)를, 표준
단일 컴포넌트 `@topgrid/grid-core`의 `<Grid>`로 **점진 교체**하는 채택(adoption) 작업이다.
새 컴포넌트·새 prop·새 설계 결정이 만들어지지 않는다. 교체는 의미상 다음 한 줄로 요약된다:

```tsx
// before — deprecated 호환 alias
import { BaseGrid } from '@topgrid/grid-core/legacy';
<BaseGrid data={rows} columns={columns} loading={loading} emptyText="..." />

// after — 표준 API 직접 사용
import { Grid } from '@topgrid/grid-core';
<Grid data={rows} columns={columns} enableSort enableFilter loading={loading} emptyText="..." />
```

`<Grid>`로 직접 옮길 때 핵심은 alias가 내부적으로 항상 켜 두던 `enableSort` /
`enableFilter`를 명시적으로 적어 주는 것이다(alias는 정렬·필터를 항상 활성화하는
래퍼였다). `rowSelection` / `onRowClick` / `loading` / `emptyText` / `className` 등
나머지 prop은 그대로 통과한다. 페이지네이션을 쓰지 않던 사용처는 `enablePagination`을
추가하지 않는다(외부 페이지네이션과의 중복 방지).

## 2. 유일한 제품 지식 — deprecated alias → `<Grid>` 채택 경로

이 모듈에서 건드리는 호환 alias·그 `<Grid>` prop 매핑·deprecation 정책은 **이 모듈이
정의한 것이 아니다.** 모두 통합 Grid 래퍼 모듈(`@topgrid/grid-core`, `<Grid>`)에서
신설·정의되었고, 본 모듈은 그것을 *소비/제거*할 뿐이다.

따라서 다음 사실만 기억하면 된다(상세 매핑·정책은 mod-grid-01 §5 참조):

- `@topgrid/grid-core`는 `@topgrid/grid-core/legacy` sub-entry로 deprecated 호환
  alias(`BaseGrid` 외 4종)를 제공한다. 메인 entry 경유 import도 호환된다.
- alias는 props만 `<Grid>`로 매핑하는 얇은 shim이다. 예: `BaseGrid` = 정렬·필터
  항상 활성 + `enablePagination={pagination !== undefined}` + 선택/이벤트/표시 prop 통과.
- alias는 mount 시 dev 모드 1회 deprecation 경고를 내고 production에서는 침묵한다
  (`useDeprecationWarn`). 모두 다음 major에서 제거 예정이며, 1 minor 동안만 유지된다.
- **권장 경로는 항상 `<Grid>` 직접 사용**이다. alias는 마이그레이션 호환을 위한
  과도기 표면일 뿐, 신규 코드에서 쓰지 않는다.

`ColumnDef`는 표준 `@tanstack/react-table`의 타입을 그대로 쓴다 — alias→`<Grid>`
교체 시 컬럼 정의 형태는 바뀌지 않으므로, 교체는 `<BaseGrid>` → `<Grid enableSort
enableFilter>` 한 곳에 surgical하게 국한된다.

## 3. 채택 시 주의점 (사용처 교체 체크리스트)

제품 사용자가 동일한 "호환 alias → `<Grid>`" 채택을 진행할 때 반복적으로 부딪히는
실질 포인트:

- **한 파일에 alias 호출이 여러 개면 모두 함께 교체**한다. import는 1줄이라도 JSX
  호출이 하나라도 남으면 미정의 참조가 되어 빌드가 깨진다. 탭/조건부 렌더 안쪽,
  모달 안쪽의 그리드도 빠뜨리지 않는다.
- **사용처별 prop을 surgical하게 보존**한다. 어떤 호출은 `onRowClick`/`className`을
  쓰고 어떤 호출은 쓰지 않는다. 일괄로 추가하면 미정의 핸들러 참조 또는 외관 회귀가
  난다 — 호출 단위로 원래 쓰던 prop만 유지하고 `enableSort enableFilter`만 더한다.
- **페이지네이션 중복 주의.** 외부 페이지네이션을 별도로 렌더하던 사용처에
  `<Grid>` 내장 페이지네이션(`enablePagination`)을 켜면 푸터가 이중으로 보인다.
  alias가 페이지네이션을 안 쓰고 있었다면 그대로 끈 채 옮긴다.
- **외관 동등성**은 alias가 곧 `<Grid …>` 호출을 풀어쓴 것과 같다는 점에서
  이론적으로 보장된다(같은 컴포넌트로 수렴). 그래도 셀 padding / row height /
  정렬 글리프 / sticky thead / loading skeleton / 빈 상태 메시지는 교체 후 확인한다.
- **이미 표준 상태인 사용처**도 있다. 일부 화면은 이미 `<Grid>`를 직접 쓰고 있어
  교체가 아니라 "이미 목표 상태" 검증으로 끝난다 — 무리해서 바꾸지 않는다.

---

본 모듈에서 더 깊은 그리드 기능·prop 계약·설계 근거가 필요하면 통합 Grid 래퍼 모듈
문서(mod-grid-01)를 본다. 본 문서는 "기존 사용처를 deprecated 호환 alias에서 표준
`<Grid>`로 옮긴다"는 채택 절차만을 제품 중립적으로 기록한다.
