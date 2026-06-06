# MOD-GRID-48 — flat-path 트리 빌더 (buildTreeFromPaths)

dev-harness 31번째 (vN-9). 갭분석 Master-Detail & Tree ❌ 4 중 **node-pure 1** = **Tree data via flat path (getDataPath)**.
경쟁: AG treeData + getDataPath. ★시트/pivot/agg 트랜스폼 동형 — flat path-rows → 계층 구조(grid-core getSubRows 소비).

## reuse-gate (LESS-003) + 분할 (advisor spec-gate)
- **이미 있음**: grid-core `getSubRows`(parent-pointer 트리 + getExpandedRowModel + `__expand__` 토글 col + 16px indent).
- **부재**: flat path(`['A','B','C']`) → 계층 변환. AG getDataPath 는 path callback → grid 가 트리 구성. topgrid 는 parent-pointer 만.
- **★분할(advisor)**: Master-Detail/Tree ❌ 4 = **getDataPath 트리 빌더**(node-pure 트랜스폼) + **auto group column**(설정형 group-col
  *렌더* = browser) + **master-detail+virtualization**(virtualizer wiring) + **viewport row model**(서버 스트리밍 프로토콜=**node substance 0**,
  모듈 아님). → buildTreeFromPaths 만 추출. **1행만 flip**(getDataPath), 나머지 3 ❌ 유지.

## ★ 핵심 결정 (advisor)
1. **★synthetic-parent dedup**(spine): `['A','X']`+`['A','Y']` → **하나의** synthetic 'A' 부모 + 자식 2(두 'A' 노드 아님).
2. **explicit row = prefix 양가성**: path 가 explicit data row **이면서** 다른 path 의 prefix(`['A']` row 존재 + `['A','X']`) → AG 처럼
   **데이터를 group 노드에 부착**(별 노드 합성 안 함). order-무관(둘 중 먼저 와도 같은 결과).
3. **ordering**: 자식=first-seen. synthetic 부모=첫 자식 위치(생성 시 push). duplicate full path → last row 데이터 승.
   empty path `[]`→스킵(노드 없음). single-segment→root.

## Goals
- **G-1 buildTreeFromPaths — 종결형(순수)**:
  - `buildTreeFromPaths(data, getDataPath) → TreeNode[]`. TreeNode=`{path,key,data:T|null(null=synthetic),children}`. prefix 재귀 ensure
    (dedup via key map), explicit row→node.data 부착. 소비자가 roots→grid data + `getSubRows=(n)=>n.children` 로 사용.
  - **검증**: node(strip-types, grid-core 패턴) — ★synthetic-parent dedup(['A','X']+['A','Y']→1 부모 2자식)·explicit-row-as-prefix
    (['A']+['A','X']→A.data 부착·order 무관)·ordering(first-seen)·duplicate full path(last 승)·empty path 스킵·single-segment root·다레벨.

## In / Out
- **In**: 순수 `buildTreeFromPaths`(grid-core, getSubRows 소비). node 검증.
- **Out(browser/❌ 유지)**: auto group column(설정형 group-col 렌더) · master-detail+virtualization(virtualizer wiring) · viewport row
  model(서버 스트리밍, node substance 0).

## ★ ❌ 닫힘 마커 (advisor — 🟡, 1행만)
- **getDataPath tree = 🟡**: 데이터-모델 절반(빌더) ship+node. **표현 절반(auto group column=설정형 path-label group-col) 부재**
  (`__expand__`+16px indent 는 degenerate 렌더, 기능 아님) → 번들 partial=🟡(auto-group-col render=browser, getDataPath+auto-group-col=
  coherent 🟡+❌ 쌍). applyTransaction 선례 비적용(트리=계층 *표시* 가 핵심).
- **나머지 3 ❌ 유지**: auto group column·master-detail+virt·viewport(4행 클러스터, 1 flip — MOD-47 "2번째 flip 금지" 동형).
- COMMERCIAL-GAP: **1 ❌→🟡** → ❌35→34·✅223·🟡69→70(Master/Detail&Tree +1🟡/−1❌·Enterprise 21→20).

## AC (측정 가능)
G-1: ★dedup·explicit-prefix 부착·ordering·duplicate·empty/single·다레벨. 전부 node.

## constraints
- **MIT**(grid-core, getSubRows 소유처). 외부 dep 0. C-003. **LESS-006**: 순수 → node ceiling(auto-group-col 렌더=browser=Out).
  NUL-join key(충돌-안전, MOD-36 동형).

## 의존
grid-core 내부(신규 파일). 신규 외부 dep 0.

## 분류 (MASTER §2)
buildTreeFromPaths = **종결형**(순수 트랜스폼).

## reuse-gate 결과 / 추측 0
재사용=grid-core getSubRows(소비처). 신규=buildTreeFromPaths. 추측 0: AG getDataPath/synthetic parent/data-on-group = 1차.
viewport=node substance 0 명시. 나머지 3 ❌ 유지.

## specify rubric (Full — 점수, 게이트 C)
- [x] Goal(tree from path, AG 대응) **9/10** · [x] In/Out(빌더 In·auto-group-col/MD-virt/viewport Out) **10/10**
- [x] AC 측정(★dedup·explicit-prefix·ordering, node) **10/10** · [x] reuse-gate(getSubRows 소비·1행 flip·viewport=0 substance) **10/10**
- [x] constraints(MIT·LESS-006·NUL-key) **9/10** · [x] 의존(내부, 외부 0) **10/10**
- [x] 추측 0(AG 1차) **9/10** · [x] 분류(§2 종결형) **10/10**
- **합계 77/80 — 게이트 통과.**

---

## G-1 결과 (완료 — 2026-06-07) → MOD-48 = {G-1} 완주, §3 이관
**구현**(신규 파일 `grid-core/src/internal/buildTreeFromPaths.ts`): `buildTreeFromPaths(data, getDataPath)→TreeNode[]`. prefix 재귀
`ensure`(NUL-key map dedup)·explicit row→node.data 부착·empty path 스킵. index export·package.json test 추가.
**검증**: node **buildTreeFromPaths.test.ts 11/0**(grid-core suite 74): ★synthetic-parent dedup·explicit-prefix(order 무관)·다레벨·
duplicate(last 승)·empty 스킵·single root·shared-prefix 분기·★NUL-key 충돌안전([AB]≠[A,B]). typecheck 0·tsup build green.
**closure(advisor)**: getDataPath ❌→🟡(데이터-모델 ship·auto group column 렌더=browser, 4행 클러스터 1 flip). COMMERCIAL-GAP ❌35→34·
🟡69→70(Master/Detail&Tree 8/6/2·Enterprise 21→20). 신규 lesson 없음(NUL-key/dedup 기존 규율).

## ★ vN 라운드 runway 종료 (advisor)
본 모듈이 **마지막 깨끗한 node-pure 추출**. MOD-49(go-to-page·.xlsx import·Excel cell styles)=browser/format-lib(node substance 박약)·
MOD-50+=사용자 제품결정 게이트. → MOD-48 commit 후 wall 보고(MOD-49 를 억지 node-pure 화 금지).
