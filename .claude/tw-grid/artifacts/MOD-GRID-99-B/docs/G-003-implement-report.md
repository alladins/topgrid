# G-003 Implement Report: Playwright 시각 회귀 자동화

**Goal ID**: MOD-GRID-99-B / G-003  
**Status**: IMPLEMENTED  
**Implementer**: tw-grid Implementer  
**Date**: 2026-05-15  
**Spec Authority**: G-003-spec.md Section 7 (C-30)

---

## 구현 완료 파일 (7/7)

| # | 파일 경로 | 변경 유형 | 상태 |
|---|-----------|-----------|------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/playwright.config.ts` | NEW | 완료 |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/tests/visual/storybook.spec.ts` | NEW | 완료 |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/.github/workflows/visual-regression.yml` | NEW | 완료 |
| 4 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/visual-regression.md` | NEW | 완료 |
| 5 | `D:/project/topvel_project/topvel-grid-monorepo/apps/docs/package.json` | MODIFY | 완료 |
| 6 | `D:/project/topvel_project/topvel-grid-monorepo/package.json` | MODIFY | 완료 |
| 7 | `D:/project/topvel_project/TOMIS/.claude/worktrees/tw-grid-mod99b-g001/.claude/tw-grid/decisions/MOD-GRID-99-B-decisions.md` | MODIFY | 완료 |

---

## 인수 조건 이행 검증

| AC | 조건 | 이행 여부 |
|----|------|----------|
| AC-001 | decisions.md에 ADR-007 (Playwright 채택, trade-off 4개) | ✅ — ADR-MOD-GRID-99-B-007 추가, 4 trade-off 표 형식 기록 |
| AC-002 | visual-regression.yml 존재 + `visual:test` script | ✅ — .github/workflows/visual-regression.yml 생성, apps/docs/package.json에 script 추가 |
| AC-003 | block-on-migration-impact job, label 조건부 exit 1 | ✅ — needs: visual-regression + if: failure() + label 조건 + exit 1 |
| AC-004 | storybook.spec.ts 12개 story 순회 + 1000행 가상화 timeout | ✅ — index.json/stories.json 동적 읽기 + isVirtualized timeout 60000ms |
| AC-005 | visual-regression.md 존재 + baseline 업데이트 절차 명시 | ✅ — EC-01/EC-02 대응 가이드 포함 |

---

## promptSpecDrift 기록

| ID | 항목 | Drift 내용 | 처리 |
|----|------|-----------|------|
| PSD-001 (spec D1) | C-28 prefix 정정 | goals.json `TOMIS/.github/...` → `topvel-grid-monorepo/...` | spec Section 7 권위 준수 |
| PSD-002 (spec D2) | 3→7 파일 확장 | goals.json 3개 → spec 7개 | D2 결정 준수 |
| PSD-003 (spec D3) | `.github/` 신규 디렉토리 | GitHub Actions 표준 경로 | 생성 완료 |
| PSD-004 (spec D4) | `tests/visual/` 신규 디렉토리 | monorepo root 표준 테스트 경로 | 생성 완료 |
| PSD-005 (spec D5) | ADR-007 trade-off 4개 의무 | Playwright vs Chromatic | decisions.md 추가 완료 |
| **PSD-006** (신규) | **Storybook 8 index.json vs stories.json** | Storybook 8 기본 산출은 `index.json` (entries 키). spec은 `stories.json`(v6 legacy) 하드코딩. storybook.spec.ts에서 index.json 우선 시도 후 stories.json 폴백 구현으로 양 버전 호환. | storybook.spec.ts에 폴백 로직 구현 |
| **PSD-007** (신규) | **decisions.md 경로 불일치** | spec Section 7 #7 `topvel-grid-monorepo/.claude/...` vs 실재 파일 `TOMIS/.claude/worktrees/.../decisions/` | TOMIS worktree 경로(실재 파일) 기준 편집. 결과 동일. |
| **PSD-008** (신규) | **devDeps 위치: prompt vs spec** | prompt: monorepo root devDeps; spec Section 11 Step 5: apps/docs devDeps | spec 권위 (C-27) — apps/docs에 배치. monorepo root devDeps 미추가. |

---

## 자가 검증 결과

| 검증 항목 | 결과 |
|-----------|------|
| Glob 4 파일 존재 확인 | ✅ 4 hits |
| `@playwright/test` in apps/docs/package.json | ✅ 1 hit |
| `visual:test` in apps/docs/package.json | ✅ 1 hit |
| `visual:test` in monorepo root package.json | ✅ 1 hit |
| `visual:test` 합 2+ hits | ✅ 2 hits |
| `ADR-MOD-GRID-99-B-007` in decisions.md | ✅ 1 hit |

---

## pnpm install 미실행 사유

G-001 finding 인용: `pnpm install`은 Implementer 범위 외. 패키지 설치는 G-001에서 확인된 바와 같이 monorepo root에서 별도 수행. devDependencies 추가만으로 spec 이행 완결. CI workflow에서 `pnpm install` step이 자동 실행되므로 로컬 실행 없이 파일 편집만으로 충분.

---

## 결과

7/7 완료. AC-001~005 전량 이행. PSD-006(Storybook 8 index.json 폴백) + PSD-007(decisions.md 경로) + PSD-008(devDeps 위치) 3건 신규 drift 발견 및 spec 권위 기준 처리.
