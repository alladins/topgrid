# TWGRID — 진행해야 할 작업 통합 리스트 (백로그)

> 2026-06-06 정리. 이번 세션(워크플로우 무결성 감사·시정)까지 반영한 **남은 작업 단일 SSoT**.
> 출처: `release_queue`(state.json) · `WORKFLOW-INTEGRITY-AUDIT.md`(B/C/D) · COMMERCIAL-GAP vN · 메모리.
> 우선순위 = P0(즉시) → P4(연기 확정). "발행"과 "검증 부채"는 분리한다.

---

## P0 — 발행 (즉시, **사용자 실행 영역**)

- [ ] **prepared batch 발행**: `pnpm --filter "@topgrid/*" publish --access public --no-git-checks`
  - travia71 Granular Token + **Bypass-2FA ON** 필수([[npm-publish-topgrid]]). 코드 무변경=빌드 그대로 green.
  - 이번 시정 브랜치 `remediation/workflow-integrity-2026-06-06` → main 병합 후 권장(문서만, 발행 자체엔 무관).
- [ ] **발행 전 점검 — TOMIS provenance scrub 확인**([[topgrid-tomis-provenance-leak]]): 발행물·소스에 TOMIS 내부 경로
  노출 여부. *최근 감사: 전 패키지 dist 금지어(TOMIS/@tomis)=0·@topgrid 단방향 clean*(§5.3) → **확인만**, blocker 가능성 낮음.

## P1 — 검증 부채 (★이번 세션이 드러낸 **최대 잔여 리스크**)

> "테스트 통과 ≠ 목표 로직". 독립 검증이 **순수 코어(node)만** 닿았고 wiring/browser 층은 비었다(WORKFLOW-INTEGRITY-AUDIT §7.4).

- [ ] **(D) browser/wiring verify 실집행**: MOD-38/39(전부 browser-only) + 전 chromium 스펙을 storybook 빌드→playwright
  로 **실제 1회** 돌려 state.json "chromium N/N" 주장을 영속 검증. **known-broken `storybook.spec.ts`(playwright 1.60 API
  drift + baseline 0 → 전수 fail) 수리** 포함. 중위험·인프라.
- [ ] **독립 검증 확장**: 요구사항-도출 adversarial 검증을 3개 샘플(MOD-34/36/37 순수코어, 25/25)에서 **나머지 모듈 +
  wiring 층**으로 확대. 특히 차트 실렌더(RangeChart)·flash effect 배선·column menu/row pin 상호작용.

## P2 — 프로세스 게이트 복원 (재발 방지)

- [ ] **(B) 차기 모듈 게이트 강제**: implement 진입 전 **spec 파일 + §6 로드맵 등재 필수화**(README 루프 게이트 재적용).
  MOD-28(§6)·MOD-34(specs)부터 빠졌던 앞단 복원.
- [ ] **(C) rubric 정량 채점 영속화**: specify 8항목 체크리스트를 점수로 명시 기록하도록 `verify` done_gate 에 추가
  (현재 "정의됐으나 어느 모듈도 점수 미영속화").

## P3 — 문서 정합 정리 (저위험)

- [ ] **COMMERCIAL-GAP 헤드라인 카운트 재집계**: 종합표(199/60/68)가 MOD-28~33 까지만 반영 → **MOD-34~39 닫힘 +
  roving🟡** 미반영(stale). 카테고리 표·"Community 31"·dedup 68 도 재산정 필요.
- [ ] **MOD-18~21 state.json `spec` 필드 채움**: spec 파일은 디스크에 존재하나 필드만 비어있음(cosmetic, 18/22 참조).
- [ ] **§5.2 minor 정정 권장 항목**: 주석/README/JSDoc stale(G1·G2·G-readme14·P25-1 `.s` 제거 등) — 동작 영향 0, 정정만.

## P4 — 기능 백로그 (vN, **연기 확정**)

### 4 escalated decision (사용자 "전부 vN" 결정)
- [ ] Column spanning(body colSpan) — 비-bounded(col-virt/핀/ARIA 얽힘), full-width 스팬 이미 4경로 존재
- [ ] Custom cell editor slot — 편집 컴포넌트 등록 API 설계 결정
- [ ] Full-row editing 모드 — per-cell→행 단위 edit/commit, 편집 모델 결정
- [ ] RTL 레이아웃 — invasive(핀 오프셋 LTR 전제 등), 한국시장 우선순위 낮음

### 9 Community vN
- [ ] post-sort callback · applyTransaction(증분) · async transaction batching · auto-page-size · custom page formatter
  · debounced-scroll · row animation · auto-virtualization-threshold · drag-between-grids

### Enterprise vN 클러스터 (deep)
- [ ] 차트 panel/dock·cross-filter(클러스터 7중 2) · advanced filter 쿼리빌더 · viewport row model · tree getDataPath/auto
  group col · group/hierarchy selection · sidebar/filters tool panel · sticky group headers · pivot panel·server-side
  pivot·total customization · master-detail+virtualization · grand-total footer
- [ ] **풀 스프레드시트**(grid-pro-sheet vN): 멀티시트(Sheet2!A1) · $A$1 절대참조 · 명명범위 · 셀 서식 · VLOOKUP/date/financial
  · 상대참조-on-fill · .xlsx 수식 import/export
- [ ] 모듈별 vN(state.json): MOD-39 가상화+핀 · MOD-26 풀시트 · MOD-22 LRU 캐시 등

## 별도 — 인프라/운영

- [ ] **docs site 재배포**(문서 변경 반영 시): topgrid.platree.com, 서버 gedebms, rsync([[docs-site-hosting]]).
- [ ] 발행 시 **peerDep major escalation 주의**([[changeset-peerdep-major-escalation]]): 수동 0.x bump 전략 유지(changeset version 금지).

---

> **권장 순서**: P0(발행) ↔ P1(검증 부채)은 사용자 판단 — 발행을 막을 fabrication 은 없으나(감사 결론), 상용 제품 신뢰도
> 관점에서 **P1-(D) browser verify 실집행을 발행과 병행/선행**할지가 핵심 결정. P2~P3 는 발행과 무관히 후속. P4 는 차기 버전.
