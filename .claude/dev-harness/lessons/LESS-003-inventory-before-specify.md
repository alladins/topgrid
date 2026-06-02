---
id: LESS-003
signature: inventory-before-specify-collapses-scope
first_seen: MOD-GRID-21 (grid-pro-panel) 2026-06
status: lesson (N=1)
related: [PAT-001, ADR-001, "reuse-gate (DESIGN §3.1)"]
---

# LESS-003 — specify 전 기존 표면 인벤토리 → 'Full' 모듈이 대부분-재사용으로 축소

## 증상 (검증 가능 사실)
MOD-GRID-21 `grid-pro-panel` 은 state.json 에서 weight=Full 로 분류됐다(패널 3종 신규 빌드처럼
보임). specify **전에** 기존 표면을 인벤토리하자 3중 2가 이미 존재:
- **RowGroupPanel** ← `@topgrid/grid-pro-agg` `GroupPanel`(드래그 그룹핑 바 완성) **그대로 재export**
  (구현 22줄 watermark 래퍼, 자체 드래그 로직 0 — verify grep `onDrop|dataTransfer|addToGrouping` = 0).
- **ToolPanel** ← grid-core `columnVisibility`/`columnOrder` state 를 **콜백으로 구동**(state 머신 재구현 0).
- **StatusBar** ← 기존 등가물 0 = 유일한 순수 신규.

## 왜 중요한가
인벤토리를 건너뛰면 implement 에이전트가 **이미 있는 걸 재구현**한다(드래그 그룹핑 바·컬럼 표시
state 머신). 이는 (1) 중복 코드, (2) agg `GroupPanel` 과 동작 분기 위험, (3) 헛된 토큰. 인벤토리는
"Full" 라벨을 실제 신규 작업량으로 재평가하게 한다(여기선 신규≈StatusBar 1개).

## 올바른 형 (how to apply)
**specify 전 reuse-gate(DESIGN §3.1) 단계에서 기존 표면을 실제로 읽는다**:
1. 인접 패키지의 export(특히 같은 도메인: agg·core·features)를 grep/read.
2. 겹치는 조각은 스펙에 **재사용을 AC 로 박는다**(예 "RowGroupPanel 은 agg `GroupPanel` 위임 —
   재구현 0; verify 가 자체 드래그 핸들러 0 을 grep").
3. **deprecated 표면 위에 짓지 않는다**(C-002): grid-core `ColumnVisibilityMenu` 는 `@deprecated`
   (ADR-013) → ToolPanel 은 그 위가 아니라 신규 얇은 UI 가 state 를 구동.
4. 재사용 스펙트럼을 구분: MOD-18 = **어휘 재사용**(agg 키 상수, reducer 는 신규 — ADR-001),
   MOD-21 = **컴포넌트 재사용**(agg `GroupPanel` 통째 re-export). 둘 다 정직히 분류(억지 재사용 금지).

## 출처
MOD-GRID-21. spec `.claude/dev-harness/specs/MOD-GRID-21.md`(재사용 인벤토리 섹션),
구현 `packages/grid-pro-panel/src/RowGroupPanel.tsx`. reuse-gate 의 **첫 실전 검증**.
