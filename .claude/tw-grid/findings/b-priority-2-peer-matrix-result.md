# B 우선 2 — ADR-MOD-GRID-00-008 peer 매트릭스 갱신 결과

**실행일**: 2026-05-18  
**상태**: completed

---

## 변경 요약

ADR-MOD-GRID-00-008 원 매트릭스(2026-05-13 기준)와 Wave 1~5 + 잔존 4 + Phase 6 + B 우선 1 이후 실제 package.json 상태 간 누적 drift를 해소하고 신규 peer 카테고리를 추가했다.

### 주요 갱신 항목

| 항목 | 원 매트릭스 | 갱신 후 |
|------|-----------|--------|
| 패키지 범위 | "12개" | "13개" (grid-license 포함 재산정) |
| `@tanstack/react-virtual` 적용 대상 | 2개 (grid-core + grid meta) | 6개 (+ grid-features, grid-pro-range, grid-pro-merging, grid-pro-agg) |
| `xlsx` 버전 | `^0.18.0` | `^0.18.5` |
| `xlsx` optionality (grid-export) | optional | **필수** (`peerDependenciesMeta.optional=false`) |
| `jspdf-autotable` 버전 | `^3.8.0` | `^3.5.0` (실제 상태 반영, OQ-001 open) |
| `@tomis/grid-core` workspace peer | 미기재 | **신규 카테고리**: grid-renderers, grid-pro-tracking, grid-pro-merging, grid-pro-master 4개 |
| `date-fns` / `react-datepicker` | 미기재 | **신규**: grid-features 전용 peers |

---

## 변경 파일

| 파일 | 변경 |
|------|------|
| `.claude/tw-grid/decisions/MOD-GRID-00-decisions.md` | ADR-MOD-GRID-00-008 하단에 Amendment 블록 추가 (갱신 매트릭스 + Wave/Phase별 내역 + OQ 2건) |

---

## 검증

| 항목 | 확인 방법 | 결과 |
|------|---------|------|
| @tanstack/react-virtual 6개 | package.json 13개 직접 확인 | grid-core, grid-features, grid-pro-range, grid-pro-merging, grid-pro-agg, grid meta — 6개 peerDep 확인 |
| xlsx ^0.18.5 + optional=false | grid-export/package.json 확인 | `^0.18.5`, `peerDependenciesMeta.xlsx.optional: false` 확인 |
| jspdf-autotable ^3.5.0 | grid-export + grid/package.json 확인 | 양쪽 모두 `^3.5.0` 확인 |
| @tomis/grid-core workspace peer | grid-renderers, grid-pro-tracking, grid-pro-merging, grid-pro-master package.json | 4개 모두 `peerDependencies."@tomis/grid-core": "workspace:*"` 확인 |
| Phase 6 devDeps (build-ordering) | grid-pro-range, grid-core, grid-pro-tracking package.json | devDependencies 확인 — peer 매트릭스 기재 제외 확인 |
| B 우선 1 결과 통합 | b-priority-1-grid-pro-merging-hardening-result.md | completed 확인 — grid-pro-merging devDep 포함 |
| ADR Amendment 기록 | MOD-GRID-00-decisions.md line 355 이후 | Amendment 블록 삽입 확인 |

---

## 결과 체크리스트

- [x] 원 매트릭스 baseline 확인 (ADR-008 lines 309-317)
- [x] 13개 package.json 전수 인벤토리
- [x] drift 항목 식별: react-virtual 범위, xlsx 버전/optionality, jspdf-autotable 버전
- [x] 신규 peer 카테고리 식별: @tomis/grid-core (workspace peer), date-fns, react-datepicker (grid-features 전용)
- [x] B 우선 1 결과 확인 및 통합 (completed 2026-05-18)
- [x] Phase 6 devDep 변경 narrative 정리 (peer 매트릭스 기재 제외, build-ordering 주석)
- [x] Amendment 블록 작성 및 삽입 (MOD-GRID-00-decisions.md)
- [x] 갱신 매트릭스 표 (10행) + Wave/Phase 내역 표 + OQ 2건 기록
- [ ] OQ-001 해소: jspdf-autotable ^3.5.0 유지 vs ^3.8.0 상향 — 별도 결정 필요
- [ ] OQ-002 해소: grid-pro-range @tomis/grid-core peerDep 승격 여부 — 별도 결정 필요

---

## 알려진 한계

- Phase 6 fix #2에서 식별된 `grid-pro-merging` latent race는 B 우선 1로 해소됨 (devDep 추가 완료).
- `jspdf-autotable` 버전 불일치(OQ-001)는 단순 기재 오류일 수 있으나, `^3.5.0` vs `^3.8.0` 기능 차이 확인 없이 매트릭스를 수정하면 의도하지 않은 버전 요구사항 변경이 될 수 있어 open으로 남김.
- `grid-pro-range` @tomis/grid-core(OQ-002): 현재 stories 전용 devDep이므로 배포 bundle에 영향 없음. 라이브러리 API에서 grid-core를 직접 사용하는 경우에만 peerDep 승격 필요.
- build-ordering devDep (grid-pro-master/tracking/merging의 @tomis/grid-core, grid-core의 @tomis/grid-renderers)은 배포 peer 아님 — 매트릭스에 기재하지 않음.

---

## 참조

- 갱신 ADR: `.claude/tw-grid/decisions/MOD-GRID-00-decisions.md` — ADR-MOD-GRID-00-008 Amendment 블록
- ADR-002 결과: `.claude/tw-grid/findings/wave3-adr-002-result.md`
- ADR-009 결과: `.claude/tw-grid/findings/wave2-adr-009-result.md`
- ADR-011 결과: `.claude/tw-grid/findings/wave1-adr-011-result.md`
- Phase 6 fix #2 결과: `.claude/tw-grid/findings/wave-residual-4-phase6-infra2-result.md`
- B 우선 1 결과: `.claude/tw-grid/findings/b-priority-1-grid-pro-merging-hardening-result.md`
