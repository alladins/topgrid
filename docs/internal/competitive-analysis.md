# 경쟁 그리드 비교 분석 (XX Grid / xxxx 대비 @topgrid)

상용 데이터 그리드 시장의 두 기준점인 **XX Grid**(Community/Enterprise)와 **xxxx
FlexGrid**(Mescius) 대비, @topgrid 가 어떤 기능을 어느 패키지로 제공하는지 정리한
기능 매트릭스와 갭 분석이다. 비교 대상 vendor 의 제품명·기능명·가격은 출처 기준
그대로 인용하고, @topgrid 측은 실제로 기능을 제공하는 패키지(`@topgrid/grid-*`) 를
명시한다.

- 제품 구성: 13 패키지 (MIT 코어 4 + Pro 8 + 메타 1)
- 비교 기준: XX Grid 33.x / xxxx FlexGrid 5.20261.x
- 관점: 기능 단위 1:1 매핑 (feature → 제공 패키지)

---

## 1. 패키지 구성 (기능 제공 단위)

@topgrid 은 단일 거대 번들이 아니라 기능별로 분할된 패키지 set 이다. 소비자는
필요한 기능만 설치해 번들을 최소화한다.

| 패키지 | 라이선스 | 역할 |
|--------|---------|------|
| `@topgrid/grid-core` | MIT | 공통 `<Grid />` wrapper, 컬럼 팩토리, 상태 통합 훅, 정렬/페이지네이션/선택/리사이즈/피닝/스티키 헤더 |
| `@topgrid/grid-renderers` | MIT | 표준 셀 렌더러 set(표시 11종 + 인라인 편집 1종) + 포매팅 헬퍼 + 타입 자동 매핑 |
| `@topgrid/grid-features` | MIT | 컬럼 드래그 재정렬, 다중 정렬 UI, 필터 UI, 글로벌 검색, 키보드 내비게이션 |
| `@topgrid/grid-export` | MIT | CSV / Excel(XLSX) / PDF 내보내기 |
| `@topgrid/grid-pro-tracking` | Pro | 변경 추적(추가/수정/삭제) + 매핑/검증 + ChangeSet 페이로드 |
| `@topgrid/grid-pro-range` | Pro | 셀 범위 선택, drag-fill, 클립보드 복사/붙여넣기 |
| `@topgrid/grid-pro-datamap` | Pro | 셀 단위 lookup(DataMap) |
| `@topgrid/grid-pro-merging` | Pro | 셀 병합(연속 동일값 자동 rowSpan) |
| `@topgrid/grid-pro-header` | Pro | 다중행 헤더(컬럼 그룹) |
| `@topgrid/grid-pro-agg` | Pro | 집계(그룹 푸터) + 그룹핑 |
| `@topgrid/grid-pro-master` | Pro | 마스터-디테일, 트리 그리드, 컨텍스트 메뉴 |
| `@topgrid/grid-license` | Pro | Pro 패키지 라이선스 키 검증 |
| `@topgrid/grid` | 메타 | 위 패키지를 묶는 메타 패키지 |

MIT 코어 4 패키지(`grid-core` / `grid-renderers` / `grid-features` / `grid-export`)
는 XX Grid Community 수준 기능을 무료로 커버하고, Pro 8 패키지는 XX Grid Enterprise
및 xxxx 상용 기능에 대응한다.

---

## 2. 기능 매트릭스 — vendor vs @topgrid

각 행은 하나의 그리드 기능이다. XX Grid 는 Community(MIT 무료) / Enterprise(유료)
티어를, xxxx 는 단일 상용 제품을 기준으로 한다. 마지막 열은 @topgrid 에서 해당
기능을 제공하는 패키지다.

범례: ✅ 제공 · ❌ 미제공 · △ 부분/우회

### 2.1 선택 (Selection)

| 기능 | AG Community | AG Enterprise | xxxx | @topgrid 제공 패키지 |
|------|:---:|:---:|:---:|------|
| 행 선택(단일/다중) | ✅ | ✅ | ✅ | `grid-core` |
| 체크박스 선택 | ✅ | ✅ | ✅ | `grid-core` |
| 헤더 전체선택 체크박스 | ✅ | ✅ | ✅ | `grid-core` |
| 셀 범위 선택(Excel 스타일) | ❌ | ✅ | ✅ | `grid-pro-range` (Pro) |
| 셀 범위 복사/붙여넣기 | ❌ | ✅ | ✅ | `grid-pro-range` (Pro) |

### 2.2 편집 (Editing)

| 기능 | AG Community | AG Enterprise | xxxx | @topgrid 제공 패키지 |
|------|:---:|:---:|:---:|------|
| 인라인 텍스트/숫자 편집 | ✅ | ✅ | ✅ | `grid-renderers` (EditableCell) |
| 날짜/select 편집 | ✅ | ✅ | ✅ | `grid-renderers` (EditableCell) |
| 커스텀 셀 에디터 | ✅ | ✅ | ✅ | `grid-renderers` |
| 변경 추적(추가/수정/삭제) | △ (Undo/Redo) | △ (Undo/Redo) | ✅ (CollectionView) | `grid-pro-tracking` (Pro) |
| 매핑/검증(저장 페이로드) | ❌ | ❌ | ✅ | `grid-pro-tracking` (Pro) |
| Drag-fill(채우기 핸들) | ❌ | ✅ | ✅ | `grid-pro-range` (Pro) |
| 신규 행 추가 | ✅ | ✅ | ✅ | `grid-pro-tracking` (Pro) |

### 2.3 필터/검색 (Filtering)

| 기능 | AG Community | AG Enterprise | xxxx | @topgrid 제공 패키지 |
|------|:---:|:---:|:---:|------|
| 텍스트/숫자/날짜 필터 UI | ✅ | ✅ | ✅ | `grid-features` |
| 글로벌 검색(quick filter) | ✅ | ✅ | ✅ | `grid-features` |
| 플로팅 필터(헤더 아래 입력) | ✅ | ✅ | ❌ | `grid-features` |
| Set 필터(Excel 체크박스 스타일) | ❌ | ✅ | ✅ | `grid-features` |
| 전문 검색(매칭 하이라이트) | △ | △ | ✅ | `grid-features` (글로벌 필터) |

### 2.4 정렬 (Sorting)

| 기능 | AG Community | AG Enterprise | xxxx | @topgrid 제공 패키지 |
|------|:---:|:---:|:---:|------|
| 단일 컬럼 정렬 | ✅ | ✅ | ✅ | `grid-core` |
| 다중 컬럼 정렬(Shift+클릭) | ✅ | ✅ | ✅ | `grid-features` |
| 커스텀 비교자 | ✅ | ✅ | ✅ | `grid-core` |

### 2.5 레이아웃/표시 (Layout & Display)

| 기능 | AG Community | AG Enterprise | xxxx | @topgrid 제공 패키지 |
|------|:---:|:---:|:---:|------|
| 컬럼 리사이즈 | ✅ | ✅ | ✅ | `grid-core` |
| 컬럼 드래그 재정렬 | ✅ | ✅ | ✅ | `grid-features` |
| 컬럼 피닝(좌/우 고정) | ✅ | ✅ | ✅ | `grid-core` |
| 행/컬럼 freezing | ✅ | ✅ | ✅ | `grid-core` |
| 행 가상화 | ✅ | ✅ | ✅ | `grid-core` |
| 스티키 헤더 | ✅ | ✅ | ✅ | `grid-core` |
| 페이지네이션(클라이언트/서버) | ✅ | ✅ | ✅ | `grid-core` |
| 셀 병합(자동 span) | ❌ | ✅ | ✅ | `grid-pro-merging` (Pro) |
| 다중행 헤더(컬럼 그룹) | ✅ | ✅ | ✅ | `grid-pro-header` (Pro) |
| 조건부 셀 서식 | ✅ | ✅ | ✅ | `grid-renderers` (`cellClassName` 콜백) |

### 2.6 계층/그룹핑 (Hierarchy & Grouping)

| 기능 | AG Community | AG Enterprise | xxxx | @topgrid 제공 패키지 |
|------|:---:|:---:|:---:|------|
| 트리 그리드(부모-자식) | △ (커스텀) | ✅ | ✅ | `grid-pro-master` (Pro) |
| 마스터-디테일(행 상세) | △ (우회) | ✅ | ✅ | `grid-pro-master` (Pro) |
| 행 그룹핑 | ❌ | ✅ | ✅ | `grid-pro-agg` (Pro) |
| 집계(그룹 푸터) | ❌ | ✅ | ✅ | `grid-pro-agg` (Pro) |
| 피벗 | ❌ | ✅ | △ | `grid-pro-agg` (Pro, 그룹핑/집계 범위) |

### 2.7 셀 데이터 (Cell Data)

| 기능 | AG Community | AG Enterprise | xxxx | @topgrid 제공 패키지 |
|------|:---:|:---:|:---:|------|
| 셀 단위 lookup(DataMap) | ✅ (refData) | ✅ | ✅ | `grid-pro-datamap` (Pro) |
| 셀 렌더러/프레임워크 컴포넌트 | ✅ | ✅ | ✅ (Cell Templates) | `grid-renderers` |
| 값 포매터 | ✅ | ✅ | ✅ | `grid-renderers` (포매팅 헬퍼) |

### 2.8 내보내기/입출력 (Import/Export)

| 기능 | AG Community | AG Enterprise | xxxx | @topgrid 제공 패키지 |
|------|:---:|:---:|:---:|------|
| CSV 내보내기 | ✅ | ✅ | ✅ | `grid-export` |
| Excel(XLSX) 내보내기 | △ (외부 lib) | ✅ (네이티브) | ✅ | `grid-export` (`xlsx` peer) |
| PDF 내보내기 | ❌ | ❌ | ✅ | `grid-export` (`jspdf` peer) |
| 클립보드 복사/붙여넣기 | ✅ | ✅ | ✅ | `grid-pro-range` (Pro) |

### 2.9 접근성/내비게이션 (Accessibility)

| 기능 | AG Community | AG Enterprise | xxxx | @topgrid 제공 패키지 |
|------|:---:|:---:|:---:|------|
| ARIA roles | ✅ | ✅ | ✅ | `grid-core` |
| 키보드 내비게이션 | ✅ | ✅ | ✅ (Excel 스타일) | `grid-features` + `grid-pro-range` |
| RTL | ✅ | ✅ | ✅ | `grid-core` (CSS logical) |

---

## 3. 티어/라이선스 비교

@topgrid 의 MIT 코어는 XX Grid Community 와 동일 가격대(무료)에서 동등 기능을
제공하고, Pro 패키지는 XX Grid Enterprise / xxxx 상용 기능에 대응한다.

| 항목 | XX Grid | xxxx FlexGrid | @topgrid |
|------|---------|----------------|----------|
| 무료 티어 | Community (MIT) | 없음(상용 전용) | MIT 코어 4 패키지 |
| 유료 티어 | Enterprise | Commercial | Pro 8 패키지 |
| 유료 가격(출처 기준) | $999 / 개발자 / 년 ※ | $695+ / 사용자 / 년, 도메인별 ※ | 자체 라이선스 모델 |
| 평가판 동작 | — | 라이선스 모달 노출 | 모달 없음 |
| 라이선스 검증 | LicenseManager 키 | 도메인 등록 / 모달 | `@topgrid/grid-license` 키 검증 |
| React 친화도 | `xx-grid-react` 래퍼 | `@mescius/xxxx.react.all` 래퍼(DOM 직접) | React 19 + TanStack 네이티브 |
| 한국어 문서 | 영문 우선 | 별도 KR 번들 | 한국어 우선 |

※ 가격은 비교 시점의 vendor 공개 정보 기준 인용. 정확한 최신 가격·라이선스 조건은
각 vendor 공식 사이트에서 재확인 권장.

### 번들 규모 비교

| 항목 | 비교 |
|------|------|
| xxxx FlexGrid 상용 번들 | 약 ~500 KB (출처: xxxx 분석) |
| @topgrid 메타 패키지 전체 | 약 ~140 KB (gzipped 추정, 한도 150 KB 이내) |
| @topgrid 부분 채택 | 기능별 패키지 분할 → 필요한 패키지만 설치 |

번들 수치는 추정치이며 실제 배포 시 `size-limit` 등으로 실측한다. @topgrid 의
이점은 단일 거대 번들이 아니라 기능 단위로 tree-shaking 되는 분할 구조에 있다.

---

## 4. @topgrid 차별화 포인트

경쟁 vendor 중 유료 티어에만 있거나 한쪽 vendor 만 제공하는 기능을, @topgrid 는
다음 Pro 패키지로 제공한다. 이는 상용 그리드 대체 시 핵심 가치다.

1. **변경 추적 + 매핑/검증** (`grid-pro-tracking`) — 추가/수정/삭제 행을 자동
   추적하고, 화면 필드를 서버 필드로 매핑하며, 행 단위 검증 결과를 포함한 ChangeSet
   페이로드를 만든다. XX Grid 는 Undo/Redo 수준만 제공하고, xxxx 는 CollectionView
   로 제공하는 영역이다. ERP/업무 CRUD 화면에서 가장 효과가 크다.
2. **셀 범위 선택 + Drag-fill + 클립보드** (`grid-pro-range`) — Excel 동등 UX.
   XX Grid 는 Enterprise, xxxx 는 상용에서만 제공한다.
3. **셀 단위 DataMap** (`grid-pro-datamap`) — 컬럼이 아닌 셀(행마다 다른 옵션) 단위
   lookup. xxxx DataMap 에 대응한다.
4. **콘텐츠 기반 셀 병합** (`grid-pro-merging`) — 같은 값이 연속되는 행을 수동 그룹핑
   없이 자동 병합(rowSpan)한다. XX Grid Enterprise / xxxx 에 대응한다.

이 4가지가 무료 라이브러리에서 보기 어려운 핵심 차별화이며, @topgrid Pro 패키지의
정당성을 이룬다.

---

## 5. 갭 분석 (out-of-scope / 한계)

정확성을 위해, 현재 @topgrid 가 제공하지 않거나 제공 방식이 경쟁 vendor 와 다른
영역을 명시한다.

### 5.1 현재 범위 밖 기능

| 기능 | XX Grid | xxxx | @topgrid 상태 |
|------|---------|-------|-------------|
| Sparkline(셀 내 미니 차트) | ✅ (Enterprise 추정 ※) | ✅ | 범위 밖 — 별도 패키지 후보 |
| 통합 차트(AG Charts 등) | ✅ (Enterprise) | — | 범위 밖 |
| 인쇄 미리보기(print preview) | △ | ✅ | 범위 밖 — 브라우저 `window.print` 위임 |

※ XX Grid 측 일부 항목(Sparkline 티어, Excel 스타일 키보드 단축키, 행 드래그
앤드롭의 Community 포함 여부)은 vendor 공식 문서의 1차 출처 확인이 일부 실패하여
**확인 필요** 상태다. 표의 XX Grid 데이터 중 이들 항목은 일반 지식 + 모듈 검증
기반이며, 도입 의사결정 시 vendor 공식 docs 재확인을 권장한다.

### 5.2 제공 방식 차이 (xxxx imperative 모델 대비)

xxxx 는 그리드 인스턴스에 대한 명령형(imperative) DOM 조작 훅을 광범위하게
노출한다(`formatItem` per-cell DOM mutation, `columnHeaders.rows[]` 직접 조작,
`hostElement` 레벨 키보드 wiring, `prepareCellForEdit` 에디터 DOM 직접 조작 등).
@topgrid 은 React + TanStack 선언형 모델을 채택하므로, 다음 영역에서 접근 방식이
다르다.

| 영역 | xxxx 방식(명령형) | @topgrid 방식(선언형) |
|------|------------------|---------------------|
| per-cell 동적 스타일 | `formatItem` DOM mutation | `cellClassName` 콜백(Tailwind class) |
| 동적/데이터 기반 헤더 | `columnHeaders.rows[]` 직접 조작 | 정적 컬럼 그룹(`grid-pro-header`) — per-cell 동적 헤더는 애플리케이션이 컬럼을 동적 생성 |
| 헤더 행 사이 병합 | `AllowMerging.ColumnHeaders` | 컬럼 그룹 구조로 표현 |
| 그리드 레벨 키보드 wiring | `hostElement` native 이벤트 | imperative ref API + 래퍼 `onKeyDown` |

이는 기능 부재가 아니라 **패러다임 차이**다. xxxx 의 명령형 DOM 훅에 깊게 의존하는
화면을 @topgrid 로 옮길 때는 선언형 등가물로의 매핑이 필요하며, 시각적 동등성은
별도 회귀 검증(시각 회귀 테스트)으로 보증하는 것이 권장된다.

---

## 6. 결론

- **XX Grid Community 대체**: @topgrid MIT 코어 4 패키지가 무료 티어 기능을 1:1
  커버한다. 가격대(무료) 동일.
- **XX Grid Enterprise / xxxx 상용 대체**: @topgrid Pro 8 패키지가 셀 범위/병합/
  집계/마스터-디테일/변경추적/DataMap 등 상용 전용 기능에 대응한다.
- **차별화 핵심 4종**: 변경 추적+매핑/검증, 셀 범위+drag-fill, 셀 단위 DataMap,
  콘텐츠 기반 셀 병합.
- **갭**: Sparkline / 통합 차트 / 인쇄 미리보기는 현재 범위 밖이며, xxxx 의 명령형
  DOM 훅 의존 화면은 선언형 매핑이 필요하다.

본 비교의 vendor 측 데이터 중 일부(XX Grid 1차 출처 일부, 가격)는 인용 시점 기준이며,
도입 의사결정 시 각 vendor 공식 자료 재확인을 권장한다.
