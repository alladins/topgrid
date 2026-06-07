# MOD-GRID-54 — 그룹 헤더 인라인 집계 (group-header inline aggregates, incl. when collapsed)

dev-harness 37번째 (**Enterprise ❌19 backlog — Tier 1 #1**, advisor triage). grid-pro-agg(**Pro**).
갭분석 **Row grouping ❌ = Aggregated values displayed inline on the group header row (incl. when collapsed)**. 경쟁: AG groupRowAggNodes·Wijmo.

## advisor triage (Tier 1 — node-correctness anchor, reuse-gate-first)
- reuse-gate: `GroupRow.tsx`=단일 colSpan(토글+키+카운트만), `FooterRow`=그룹 **끝** per-column 집계(collapsed 시 leaves+footer 숨김→사라짐). 갭=**헤더** 행 인라인 집계+**collapsed 시에도**.
- ★**avg-of-avgs 안전**(advisor 핵심): TanStack getVisibleCells(중첩 그룹=mean-of-means 위험) 대신 **`computeAggregateRow`(MOD-45, source 직접, node 15/0 tested)** 를 `row.getLeafRows()` 원본에 적용 → 중첩 그룹도 true source 집계.
- node-correctness anchor = computeAggregateRow(재사용, 기검증). 본 모듈=배선형(GroupRow 인라인 렌더). clean ✅(헤더 인라인+collapsed 가시+source-correct).

## reuse-gate (LESS-003) + scope
- 재사용: `computeAggregateRow`(source-safe 집계)·GroupRow 기존 토글/들여쓰기·resolvedColumns meta.aggregationFn. 신규=그룹 헤더 per-column 셀 렌더(grouping 컬럼=라벨·spec 컬럼=집계·기타=blank) + aggSpec 도출.
- **license**: grid-pro-agg=Pro(checkLicense+Watermark) 게이트 상속(신규 0).
- 부재 확인: grep group-header inline agg=0(GroupRow=colSpan 라벨만). genuine.

## Goals
- **G-1 그룹 헤더 인라인 집계 (chromium 발산) — 배선형**:
  - `showGroupAggregates?` opt-in prop. GroupRow 에 `aggSpec`/`leafColumns` 전달 시 단일 colSpan 대신 **per-column 셀** 렌더:
    grouping 컬럼=토글+키+카운트·aggSpec 컬럼=`computeAggregateRow(row.getLeafRows() 원본, aggSpec)` 값·기타=blank. AggregationGrid 가 resolvedColumns meta→aggSpec(field→fn) 도출.
  - **검증 node**: computeAggregateRow=MOD-45 15/0 재사용(correctness anchor, fabricate 안 함). **chromium ★발산**: ① 그룹 헤더가 집계값 인라인 표시 ② **collapsed 시에도 헤더 집계 잔존**(footer 는 사라짐)
    ③ ★**중첩 그룹 avg=true source mean**(불균등 city 행수: Seoul 2행·Busan 1행 → region avg=30 NOT avg-of-city-avgs 37.5, 정확 숫자) ④ OFF(showGroupAggregates=false) byte-identical(단일 colSpan 라벨).

## In / Out
- **In**: `showGroupAggregates?` prop + GroupRow per-column 인라인 집계(computeAggregateRow 재사용) + aggSpec 도출 + 스토리(중첩 그룹). 기존 colSpan 경로·footer·computeAggregateRow 무수정.
- **Out**: footer 행(기존 유지) · custom group-agg 포매터(후속) · TanStack getVisibleCells 기반 집계(avg-of-avgs 위험=배제).

## ★ ❌ 닫힘 마커
- **Group-header inline agg = ✅**: 그룹 헤더 per-column 집계(source-correct, collapsed 시에도). gap 해소. COMMERCIAL-GAP **Row grouping** 1 ❌→✅ → ❌27→26·✅230→231. reconcile 19/19·330.

## AC (측정 가능)
G-1 헤더 인라인 집계값·collapsed 잔존·중첩 avg=true source(정확 숫자)·OFF byte-identical(chromium). node correctness=computeAggregateRow 재사용(15/0).

## constraints
- **Pro**(grid-pro-agg, 게이트 상속). 외부 신규 dep 0.
- **LESS-006**: 인라인 렌더=브라우저 → chromium 발산. correctness(source 집계)=computeAggregateRow(node, 재사용).
- **avg-of-avgs 안전**: computeAggregateRow(row.getLeafRows() 원본) — TanStack mean-of-means 배제. 중첩 fixture 로 chromium 정확 숫자.
- **opt-in byte-identical**: showGroupAggregates=false → 기존 단일 colSpan GroupRow(무변).
- 기존 GroupRow colSpan 경로·FooterRow·computeAggregateRow 무수정(분기 추가).

## 의존
grid-pro-agg 내부(GroupRow 인라인 분기 + AggregationGrid aggSpec/leafColumns 전달 + types showGroupAggregates/GroupRowProps 확장). story=AggregationGrid. 외부 0.

## 분류 (MASTER §2)
GroupRow 인라인 집계 렌더=**배선형**(chromium). 순수 집계=computeAggregateRow 재사용(종결형, 기존).

## reuse-gate 결과 / 추측 0
재사용=computeAggregateRow(source-safe)·GroupRow 토글·resolvedColumns. 신규=헤더 per-column 인라인 분기.
추측 0: AG group row agg(헤더 행 집계, collapsed 시 표시)·Wijmo = 1차 출처. gap verified-absent.

## specify rubric (Full — 게이트 C)
- [x] Goal(헤더 인라인 집계, AG 대응) **9/10** · [x] In/Out(footer 유지·avg-of-avgs 배제 명시) **10/10** · [x] AC(collapsed 잔존·중첩 avg=true·OFF chromium) **10/10**
- [x] reuse-gate(computeAggregateRow 재사용·avg-of-avgs 안전·license 상속) **10/10** · [x] constraints(Pro·LESS-006·opt-in byte-identical) **10/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(AG 1차·verified) **9/10** · [x] 분류(배선형+종결형 재사용) **9/10** · **합계 77/80 통과.**

---

## G-1 결과 (완료 — 2026-06-07) → MOD-54 = {G-1} 완주, §3 이관
**구현**(grid-pro-agg, 기존 colSpan 경로·FooterRow·computeAggregateRow 무수정):
- `showGroupAggregates?` prop + GroupRow per-column 인라인 분기(grouping 컬럼=토글+키+카운트·aggSpec 컬럼=`computeAggregateRow(실제 leaf 원본, aggSpec)` 값·기타 blank) + AggregationGrid aggSpec(field→fn)/leafColumns 도출·전달.
- ★`row.getLeafRows().filter(r=>r.subRows.length===0)` — TanStack v8 getLeafRows 가 중간 그룹 행 포함+그룹 .original=첫 자식 → 필터로 실제 leaf 만(double-weight 회피).

**검증**: node correctness=**computeAggregateRow 15/0 재사용**(MOD-45, source-safe, fabricate 안 함) · typecheck 0 · build green · **chromium 3/3**(`agg-group-header-inline.spec.ts`) + **전체 회귀 97/97**(94+3).
- ★dept 인라인 avg=true source mean **30**(NOT avg-of-team-avgs 37.5, 불균등 자식 Seoul 2행·Busan 1행) · **collapsed 시에도 헤더 집계 잔존**(footer 는 숨김) · OFF(showGroupAggregates=false) byte-identical(단일 colSpan).

## ★ closure + 발견 (advisor)
- **Group-header inline agg = ✅**: 그룹 헤더 per-column 집계(source-correct, collapsed 시에도). gap 해소. **Row grouping 11/6/2→12/6/1**. COMMERCIAL-GAP **❌27→26·✅230→231·🟡70**(reconcile 19/19·330·0 mismatch). Enterprise ❌19→18.
- **★avg-of-avgs 안전**(advisor Tier 1 anchor): computeAggregateRow(MOD-45, source 직접) 재사용 — TanStack getVisibleCells(중첩 mean-of-means 위험) 배제. correctness=node(재사용), 렌더/collapsed 가시=chromium 발산(LESS-006).
- **★런타임 함정 발견(chromium 검출)**: `row.getLeafRows()`=TanStack v8 에서 **중간 그룹 행 포함**+그룹 행 `.original`=첫 자식 → 그대로 집계 시 double-weight(영업팀 32 오답). `subRows.length===0` 필터로 실제 leaf 원본만 → true source(30). node 만으론 못 봄(throwaway dbg 스펙으로 32 확인 후 시정)=LESS-006 동류.
- **★expanded controlled 함정**: AggregationGrid expanded=controlled(state.expanded) → collapse 시연 위해 story 가 onExpandedChange+useState 로 uncontrolled 배선(args expanded:true 만으론 토글 무효).
- FooterRow(그룹 끝, expanded 시) 별개 유지=본 모듈은 헤더 인라인(collapsed 시에도)만.

## 모듈 완주 요약
1-Goal: Enterprise backlog 2번째(advisor Tier 1). computeAggregateRow(source-safe, MOD-45) 재사용 + GroupRow per-column 인라인 렌더. correctness=node 재사용·렌더/collapsed=chromium. ★getLeafRows 함정(중간 그룹 행)=실제 leaf 필터로 시정(chromium 검출). 기존 colSpan/FooterRow 무수정(97/97). 신규 lesson 없음(LESS-003·LESS-006).
