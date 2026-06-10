# topgrid.platree.com 문서 현행화 — 심층 갭 분석

> 2026-06-11. 공개 docs 사이트(Docusaurus, `apps/docs/docs/`)를 현재 제품 표면(21 패키지·~515 public symbols·MOD-18~76)과 대조한 갭 분석. 정량화 + 우선순위 + 권고 구조.

---

## 0. 한 줄 결론

공개 사이트는 **9개 foundational 페이지뿐**이고, 그중 **5개가 STALE/BROKEN**(특히 비교 페이지가 제품을 심각하게 과소평가, 시작 예제가 깨짐), **기능 가이드·API 레퍼런스는 0개**다. 제품은 ✅248/75%인데 사이트는 ✅178/54%를 광고한다. **현행화 ≈ 5페이지 긴급 시정 + ~16–20 신규 기능 가이드 + API 레퍼런스 재활성.**

---

## 1. 현 docs 사이트 실태

**구조 (sidebars.ts):** 단일 사이드바, 9 페이지
- `intro` · `getting-started` · `architecture` · `comparison` + `migration/` 카테고리 5개(variant-table·dataTable-migration·deprecated-aliases·incremental-strategy·live-demos)

**i18n:** ko(전체) + en(`architecture`·`getting-started` **2개만**) → 나머지 7페이지 en 부재.

**API 레퍼런스:** **없음.** `docusaurus-plugin-typedoc`이 버전 정합 이슈로 비활성(docusaurus.config 주석). `typedoc.json` entryPoints = **13 패키지**(구 세트, 7+ 누락). `build/api` 미생성. → ~515 public symbols 전부 미문서화.

**제품 표면(대조 기준):** 21 패키지
- Core(MIT, 6): grid·grid-core·grid-features·grid-renderers·grid-export·grid-license (~203 symbols, MIT subset ~144)
- Pro data/구조(7): agg·pivot·serverside·master·merging·header·datamap (161 symbols)
- Pro interaction/sheet(7): tracking·range·edit-plus·filter·chart·panel·sheet (151 symbols)

---

## 2. STALE / BROKEN — 긴급 (잘못된 정보, 신뢰 훼손)

### 🔴 P0-1. `comparison.md` — 최우선 (제품을 깎아내림)
- **종합 수치가 최초감사 baseline**: ✅178(54%)/🟡60/❌89(27%) → **현 canonical ✅248(75%)/🟡73/❌6(2%)**. 21%p 과소.
- **카테고리표 19행 전부 옛 수치**(예: 피벗 ❌10→현 ❌0, 정렬 ❌4→❌1, 스프레드시트 ❌9→❌0, 기타UX ❌7→...).
- **"현재 미지원/로드맵" 섹션이 이미 출시된 기능을 "없음"으로 나열**(가장 심각):
  - 필터: 플로팅(MOD-30✅)·멀티(MOD-30✅)·어드밴스드(MOD-46🟡) — "없음"으로 표기
  - 피벗: 패널 DnD(MOD-64✅)·런타임 설정(MOD-31✅)·전치(MOD-31✅)·펼침접기(MOD-31/53✅)·정렬필터(MOD-31/44✅) — 전부 "상호작용 미지원"
  - 스프레드시트: 셀서식(MOD-62✅)·폰트/배경/테두리/정렬(MOD-63✅)·셀병합(MOD-74✅)·멀티시트(MOD-41🟡)·상대절대참조(MOD-40/41✅) — "심화 필요"
  - 기타UX: 행드래그(MOD-33✅)·그리드간드래그(MOD-66✅)·컬럼헤더메뉴(MOD-38✅)·셀툴팁(MOD-36✅)·셀플래시(MOD-36✅)·사이드바/툴패널(MOD-58/59✅) — "없음"
  → **약 30개 출시 기능이 "로드맵(미구현)"으로 표기됨.**
- **조치**: 전면 재작성. `COMMERCIAL-GAP-ANALYSIS.md`의 canonical(✅248/🟡73/❌6) + 카테고리 요약표를 공개용으로 이식. 로드맵은 실제 잔여 ❌6(RTL·post-sort·debounced-scroll·row-animation·auto-virt·Excel cell styles)만.

### 🔴 P0-2. `getting-started.mdx` — 깨진 첫 예제
- 기본 사용 예제가 `const gridState = useGridState({columns, data})` + `<Grid state={gridState} />` → **실제 API와 불일치**. 출하된 `GridProps`는 `columns`/`data`를 직접 받음(types.ts L363/365; 전 스토리가 `<Grid columns={columns} data={data} />` 사용). **신규 사용자가 복붙하는 첫 코드가 동작 안 함.**
- "13개 패키지"(현 21). Pro 설치 목록 7/14(pivot·chart·panel·edit-plus·serverside·sheet·filter 누락).
- **조치**: 예제를 실제 API로 교정(또는 useGridState 경로가 유효하면 검증해 정확히 기술), 패키지 수/목록 갱신.

### 🟠 P1-3. `intro.md`
- Pro 패키지 목록 = `tracking,range,datamap,merging,header,agg,master`(7) → **14 중 7 누락**(pivot·chart·panel·edit-plus·serverside·sheet·filter).
- 기능 한 줄 소개에 피벗·SSRM·차트·시트 등 차별 기능 미언급.

### 🟠 P1-4. `architecture.mdx`
- "13개 패키지"(현 21). 패키지 표·의존성 다이어그램 7+ 누락. i18n/en 동일 stale.

### 🟠 P1-5. `typedoc.json`
- entryPoints 13개 → 21개로 확장 필요(API 레퍼런스 재활성 전제).

### 🟡 P2-6. `migration/*` (5개) — 검토 필요
- 레거시 DataTable→`<Grid>` 마이그레이션 가이드. 코드 예제가 현 Grid API와 일치하는지 검증 필요(getting-started와 동일 위험). deprecated-aliases는 ADR-013 deprecation과 대조.

---

## 3. MISSING — 신규 필요 (전혀 없음)

### 기능 가이드: **0개** (최대 갭)
현 사이트엔 어떤 기능의 how-to 페이지도 없다. 미문서화 기능(클러스터):

| # | 기능 가이드 (제안) | 패키지 | 규모 |
|---|---|---|---|
| 1 | Grid 기본 (columns/data/state·렌더러·핸들) | grid-core | 중 |
| 2 | 정렬 (다중·로케일·null배치·서버) | grid-core/features | 중 |
| 3 | 필터링 (text/number/date/set·글로벌·플로팅) | grid-features | 중 |
| 4 | 멀티·어드밴스드·크로스 필터 | grid-pro-filter | 중 |
| 5 | 페이지네이션 | grid-core | 소 |
| 6 | 선택 (행/범위/그룹/전체페이지) | grid-core/range | 중 |
| 7 | 편집 (인라인·full-row·커스텀에디터) | grid-core/renderers/edit-plus | 중 |
| 8 | 편집 심화 (undo/redo·검증·find/replace·comments) | grid-pro-edit-plus | 중 |
| 9 | 셀 렌더러 (11종 + 커스텀 레지스트리) | grid-renderers | 중 |
| 10 | 가상화 (행·컬럼) + 성능 | grid-core | 중 |
| 11 | 행 그룹 & 집계 (그룹패널·footer·인라인) | grid-pro-agg | 중 |
| 12 | 피벗 (축·소계·전치·패널·서버) | grid-pro-pivot | **대** |
| 13 | 서버사이드 행 모델 (블록·무한스크롤·뷰포트·트리) | grid-pro-serverside | **대(68 symbols)** |
| 14 | Master-Detail & 트리 | grid-pro-master | 중 |
| 15 | 컨텍스트 메뉴 | grid-pro-master | 소 |
| 16 | 셀 병합 / 멀티-행 헤더 | grid-pro-merging/header | 소(합칠 수 있음) |
| 17 | 범위 선택 / fill handle / 클립보드 | grid-pro-range | 중 |
| 18 | 변경 추적 | grid-pro-tracking | 소 |
| 19 | 통합 차트 & 스파크라인 | grid-pro-chart | 중 |
| 20 | 사이드바 / 툴 패널 / 상태바 | grid-pro-panel | 중 |
| 21 | 스프레드시트 (수식·셀모델·서식·스타일·병합) | grid-pro-sheet | **대(32 symbols)** |
| 22 | Export & 인쇄 (Excel/CSV/PDF·클립보드·행배열) | grid-export | 중 |
| 23 | 데이터 매핑 (FK 표시) | grid-pro-datamap | 소 |
| 24 | 테마/i18n/라이선스 활성화 | grid-license/core | 소 |

→ **~16–24 페이지**(소형 병합 시 ~16, 대형 분할 시 ~24). 대형 3종(sheet·serverside·pivot)은 멀티-섹션.

### API 레퍼런스: **0개**
- ~515 public symbols 미문서화. 옵션: (a) `docusaurus-plugin-typedoc` 버전 정합 후 재활성→21패키지 자동생성(권장, 유지보수 0), (b) 수기(비권장).

---

## 4. 정량화 (작업량 추정)

| 구분 | 분량 | 노력(대략) |
|---|---|---|
| P0 긴급 시정 | comparison 전면 재작성 + getting-started 예제 교정 | 0.5–1일 |
| P1 동기화 | intro·architecture·typedoc 패키지/버전/목록 | 0.5일 |
| P2 migration 검증 | 5개 예제 현 API 대조·정정 | 0.5일 |
| P3 기능 가이드 | ~16–24 페이지 신규(대형 3종 멀티섹션) | **대(주 단위)** |
| P4 API 레퍼런스 | typedoc 재활성(버전 정합) + entryPoints 21 | 0.5–1일(정합 이슈 의존) |
| i18n | 신규 ko+en (현 en 커버리지 2/9) | ko 우선이면 ×1, 양방향이면 ×~1.6 |

**핵심:** P0+P1+P2(잘못된 정보 시정)는 **~2일 내 가능**하고 즉효(신뢰 회복). P3(기능 가이드)가 진짜 큰 덩어리.

---

## 5. 권고 우선순위 & 실행안

1. **P0 (즉시·고가치):** `comparison.md` 전면 재작성(canonical ✅248/75%·잔여 ❌6) + `getting-started` 깨진 예제 교정. → 공개 사이트가 제품을 정확히 대변.
2. **P1:** intro·architecture·typedoc 패키지 목록·버전·"21 패키지" 동기화.
3. **P2:** migration 5종 코드 예제 현 API 대조.
4. **P3 (대):** 기능 가이드 — **Pro 차별 기능 우선**(피벗·SSRM·차트·시트·필터 = 세일즈 포인트), 그다음 core. 각 가이드는 storybook 데모 링크 + 복붙 예제 + 핵심 API.
5. **P4:** typedoc 재활성으로 API 레퍼런스 자동화(유지보수 비용 0, 향후 드리프트 방지).

**재배포:** 변경 후 `apps/docs` 빌드 → rsync(서버 gedebms, topgrid.platree.com, [[docs-site-hosting]]).

> **드리프트 방지 제안:** comparison.md를 `COMMERCIAL-GAP-ANALYSIS.md`의 canonical 표에서 생성(스크립트)하면 향후 자동 동기화. 기능 가이드는 storybook 스토리와 1:1 매핑해 스토리가 곧 라이브 예제가 되게.
