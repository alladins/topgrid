# topgrid.platree.com — P3 실행 플랜 (기능 가이드 + 마이그레이션 재작성 + API 레퍼런스)

> 2026-06-11. [[DOCS-CURRENCY-ANALYSIS]]의 P0/P1/P2(잘못된 정보 시정)는 **완료**(아래 §0). 본 문서는 **P3 = 신규 콘텐츠 + 마이그레이션 재작성**의 실행 플랜이다. ★규율: **모든 코드 예제는 green 스토리/export 에 anchor**(이번 세션에 anchor 안 한 예제 4건이 broken 으로 발견됨 — `<Grid state>`·`initLicense`·`<Grid mode>`×2 계열).

## 0. P0/P1/P2 완료 상태 (참고)
- ✅ comparison.md canonical 재작성(✅248/75%, 공개 표 합산 검증 통과) · getting-started 깨진 예제 교정(ko+en) · architecture/intro/typedoc 21패키지 동기화(grid-sizing 포함) · migration 5종 검증.
- ⚠️ **migration `<Grid mode>` 결함 발견** → 안전 플래그(`:::warning`) 처리, **재작성은 P3-0**(아래).
- ✅ Docusaurus build green(ko+en) — 편집 콘텐츠 파싱 검증됨. **redeploy(rsync)=사용자 게이트**.

---

## P3-0. 마이그레이션 가이드 세트 재작성 (최우선 — 정합성 결함)

**문제**: 5개 마이그레이션 가이드가 존재하지 않는 `<Grid mode="client"|"server">` API 를 **조직 원리로** 사용(제목·prose·표·코드 전반). top-level `mode` prop 없음(stories 0 사용).

**검증된 현행 anchor** (재작성 시 이대로):
- **client 모드** = 별도 플래그 없음. `<Grid<T> columns={columns} data={data} enableSort enableFilter ... />`. anchor: `packages/grid-core/stories/*`.
- **server 모드** = `useServerSideData(datasource, opts)` → 반환 `gridProps` 가 `manualSorting/manualFiltering` 를 **소유**. 소비자는 `<Grid columns={columns} {...gridProps} virtualScrollHeight={N} />` 로 spread. anchor: `packages/grid-pro-serverside/stories/*`. ★마이그레이션의 hand-written `manualPagination`+`pagination={...}` 는 부정확(훅이 소유) — 재작성 시 훅 패턴으로.

**작업 범위**: 5파일.
1. `dataTable-migration.md` — 제목·narrative 재구성(server=useServerSideData), `mode=` 6곳 제거.
2. `8-variant-table.md` — 표·예제 `mode="client"` 4곳 → 플래그 기반.
3. `deprecated-aliases.md` — `mode="client"` 예제 정정(alias 매핑 자체는 ADR-013 대조 필요).
4. `incremental-strategy.md` — prose `mode="client"` 언급 정정.
5. `live-demos.md` — 예제 anchor 재확인.
**규모**: ~1–1.5일. **선행 homework 완료**(client/server anchor 확정, 위).

---

## P3-1. 기능 가이드 (신규) — 우선순위 순

> 각 가이드 = storybook 데모 링크 + 복붙 예제(anchor 스토리에서) + 핵심 API 표. **Pro 차별 기능 우선**(세일즈 포인트).

### Tier A — Enterprise 차별 (먼저, 가치 최고)
| 가이드 | 패키지 | entry | anchor 스토리 | 규모 |
|---|---|---|---|---|
| 피벗 | grid-pro-pivot | `<PivotGrid>`/`usePivot` | pivot(3) | 대(축·소계·전치·패널·서버) |
| 서버사이드 행 모델 | grid-pro-serverside | `useServerSideData` | serverside(4) | 대(블록·무한·뷰포트·트리) |
| 통합 차트 & 스파크라인 | grid-pro-chart | `SparklineCell`/`RangeChart` | chart(3) | 중(+크로스필터) |
| 스프레드시트 | grid-pro-sheet | `createSheet`/`useSheet`/`<SheetGrid>` | sheet(2) | 대(수식·셀모델·서식·병합) |
| 고급 필터 | grid-pro-filter | `MultiFilter`/`makeAdvancedFilterFn` | filter(2) | 중(멀티·어드밴스드·크로스) |
| 마스터-디테일 & 트리 | grid-pro-master | `<MasterDetailGrid>` | master(3) | 중 |
| 행 그룹 & 집계 | grid-pro-agg | `<AggregationGrid>` | agg(2) | 중 |

### Tier B — 코어 기능 (핵심, 빈도 높음)
| 가이드 | 패키지 | anchor |
|---|---|---|
| Grid 기본 (columns/data/flags·렌더러·핸들) | grid-core | grid-core stories |
| 정렬 (다중·로케일·null·서버) | grid-core/features | sorting stories |
| 필터링 (text/number/date/set·글로벌·플로팅) | grid-features | filter-ui stories |
| 페이지네이션 (client/server·auto-page-size) | grid-core | pagination stories |
| 선택 (행/범위/그룹/전체페이지) | grid-core/range | selection·range stories |
| 편집 (인라인·full-row·커스텀에디터) | grid-core/renderers/edit-plus | editing stories |
| 셀 렌더러 (11종 + 레지스트리) | grid-renderers | renderer stories |
| 가상화 (행·컬럼) + 성능 | grid-core | column-virtualization story |
| 컬럼 사이징 (auto-size·fit·star) | grid-sizing | sizing stories |
| Export & 인쇄 (Excel/CSV/PDF·클립보드·행배열) | grid-export | export stories |

### Tier C — 보조 Pro (소형, 빠름)
| 가이드 | 패키지 | anchor | ★비고 |
|---|---|---|---|
| 범위 선택 / fill / 클립보드 | grid-pro-range | range(2) | |
| 변경 추적 | grid-pro-tracking | tracking story | |
| 셀 병합 / 멀티-행 헤더 | grid-pro-merging/header | merging·header | 합칠 수 있음 |
| 사이드바 / 툴 패널 / 상태바 | grid-pro-panel | panel(2) | |
| 컨텍스트 메뉴 | grid-pro-master | ContextMenuGrid story | |
| 데이터 매핑 (FK) | grid-pro-datamap | datamap story | |
| 편집 심화 (undo/redo·검증·find/replace·comments) | grid-pro-edit-plus | **⚠️ 스토리 0** | ★anchor 부재 — 스토리 신규 작성 또는 node 테스트 anchor 선행 |
| 테마/i18n/라이선스 활성화 | grid-license/core | license story | |

**총 ~24 가이드**(소형 병합 시 ~18). 대형 4종(pivot·serverside·sheet + 편집 심화)은 멀티-섹션.

### ★anchor 갭
- **grid-pro-edit-plus = 스토리 0** → 가이드 작성 전 스토리(undo/redo·validation·find-replace·comments) 신규 필요. 그 외 전 Pro 패키지는 2–4 스토리 보유(anchor OK).

---

## P3-2. API 레퍼런스 재활성 (typedoc)
- 현재 `docusaurus-plugin-typedoc` 비활성(버전 정합 이슈, config 주석). `typedoc.json` entryPoints=**21로 갱신 완료**(P1).
- 작업: (a) typedoc + plugin 버전 정합 해결 → (b) `failOnWarnings:true` 통과(현 코드 TSDoc 경고 정리) → (c) 사이드바에 `api/` 카테고리 추가.
- 가치: ~515 public symbols 자동 문서화 + **향후 드리프트 0**(코드=문서). 규모: 0.5–1일(정합 이슈 의존).

---

## P3-3. 사이드바 구조 제안
```
시작하기: intro · getting-started · architecture · comparison
핵심 기능: Grid 기본 · 정렬 · 필터링 · 페이지네이션 · 선택 · 편집 · 셀 렌더러 · 가상화 · 컬럼 사이징 · Export
Pro 기능: 피벗 · 서버사이드 · 차트 · 마스터-디테일 · 집계 · 고급필터 · 범위선택 · 변경추적 · 셀병합/헤더 · 패널 · 컨텍스트메뉴 · 데이터맵 · 편집심화
스프레드시트: 개요 · 수식 · 셀 모델 · 서식/스타일/병합
API 레퍼런스: (typedoc 자동생성)
마이그레이션: (P3-0 재작성 후)
```

## P3-4. 규율 & 드리프트 방지 (필수)
1. **anchor-to-green-story 강제** — 모든 예제는 chromium-tested 스토리/export 에서 가져온다. (이번 세션 broken 4건의 근본 원인 = anchor 안 함.) novel snippet 금지.
2. **comparison.md 자동생성** — `COMMERCIAL-GAP-ANALYSIS.md` canonical 카테고리표 → 공개 표 스크립트 생성(향후 수치 드리프트 0). 현재는 수기 동기화(2026-06-11 합산 검증 통과).
3. **1:1 story↔guide 매핑** — 스토리가 곧 라이브 예제. 신규 기능 = 스토리 + 가이드 동시.
4. **TypeDoc 재활성 후** live 예제/코드펜스 검증이 build 게이트가 될 수 있음 → anchor 강제 더 중요.

## P3-5. i18n
- 현 en 커버리지 2/9(architecture·getting-started). 신규는 **ko 우선**, en 백로그. comparison·intro 는 en 부재(추가 후보).

## P3-6. 권장 시퀀싱 (phase)
1. **Phase 1 (정합·즉효)**: P3-0 마이그레이션 재작성(결함 해소) + redeploy. → 공개 사이트 정합 100%.
2. **Phase 2 (세일즈)**: Tier A 7 가이드(Enterprise 차별). → 제품 가치 가시화.
3. **Phase 3 (완성도)**: Tier B 10 + Tier C 8 가이드. edit-plus 스토리 선행.
4. **Phase 4 (자동화)**: typedoc API 레퍼런스 재활성 → 드리프트 방지 영속화.

**총 추정**: P3-0 ~1.5일 + 기능가이드 ~2–3주(24 페이지, 대형 멀티섹션) + API 0.5–1일. **Phase 1 만으로도 "정합한 공개 사이트" 달성** → 나머지는 콘텐츠 확장.
