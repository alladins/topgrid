# Finding: MOD-GRID-00-G-004 — Changeset CLI Execution Skipped (EC-01)

**Goal**: G-004 — Changesets + ESLint flat config + tw-framework-front workspace alias  
**Module**: MOD-GRID-00  
**Finding Type**: documented-deviation (ADR-003)  
**Severity**: low  
**Status**: deferred-to-G-005  
**Date**: 2026-05-14

---

## EC 매핑

**EC-01**: `@changesets/cli` 미설치 환경 — `pnpm install` 미실행 → `pnpm changeset` 명령 실행 불가.

**AC 매핑**: AC-001 (config.json 존재 여부)
- `.changeset/config.json` 파일 자체는 CLI 없이 생성/검증 가능 → **AC-001 통과**
- `pnpm changeset` CLI 실행 검증은 환경 의존 → **documented-deviation**

---

## 편차 상세

### 수행한 작업
- `D:/project/topvel_project/topvel-grid-monorepo/.changeset/config.json` 생성 완료
- 파일 내용: `access: "restricted"`, `baseBranch: "master"`, `changelog: "@changesets/cli/changelog"` 포함
- Section 2.1 스키마 100% 준수

### 수행하지 않은 작업 (환경 제약)
- `pnpm install` 실행 — topvel-grid-monorepo는 TOMIS 워크스페이스 외부 디렉토리
- `pnpm changeset` 대화형 실행 검증
- `pnpm changeset version` + `pnpm changeset publish` 실행 검증

### 환경 제약 근거
- topvel-grid-monorepo는 `D:/project/topvel_project/topvel-grid-monorepo/` (독립 git 저장소)
- TOMIS pnpm 워크스페이스에 미포함 → `pnpm install` 별도 수행 필요
- 구현 환경에서 `pnpm` CLI 직접 호출은 I/O 환경 미보장

---

## 대응 조치

**G-005 착수 전 필수 수행**:
```powershell
cd D:\project\topvel_project\topvel-grid-monorepo
pnpm install    # @changesets/cli ^2.27.0 포함 신규 devDeps 설치

# 설치 후 검증:
pnpm changeset --version   # @changesets/cli 버전 확인
pnpm changeset help        # CLI 동작 확인
```

**정상 워크플로우 검증 (설치 후)**:
```sh
pnpm changeset          # 패키지 선택 + bump type → .changeset/{hash}.md 생성
pnpm changeset version  # 버전 bump + CHANGELOG.md 업데이트
```

---

## 루브릭 영향

- **AC-001**: 파일 기반 검증 통과 (PASS)
- **AC-005**: N/A (EC-03 별도 deviation 파일 참조)
- **F-01 (파일 존재)**: PASS — `.changeset/config.json` 존재
- **Rubric 분모**: AC-001 포함. CLI 실행 AC는 분모에서 제외.

---

## 참조

- EC-01 원문: G-004-spec.md Section 6
- ADR-003: 환경 의존 AC 처리 정책
- 선례: `MOD-GRID-00-G-001-pnpm-install-skipped.md` (동일 패턴)
- 선례: `MOD-GRID-00-G-003-size-limit-execution-skipped.md` (동일 패턴)
