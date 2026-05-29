# ADR-015 Wave 3 부분 — CI 통합

**실행일**: 2026-05-17
**Wave**: 3 (CI 통합 — ADR-001 Wave 2 완료 후)
**상태**: completed
**원본 ADR**: `ADR-MOD-GRID-REFACTOR-2026-05-17-015` (decisions.md:1001)
**Wave 1 결과**: `wave1-adr-015-result.md`
**ADR-001 결과**: `wave2-adr-001-result.md`

---

## 변경된 CI yml 파일

| 파일 | 유형 | 이유 |
|------|------|------|
| `.github/workflows/build-verify.yml` | **신규** | visual-regression.yml 과 분리 — 빌드 검증은 독립 신호 |

기존 `visual-regression.yml` 은 수정하지 않음. visual regression 과 dist freshness 는 다른 관심사.

---

## 추가된 단계 (build-verify.yml)

| step | 명령 | 목적 |
|------|------|------|
| Build all packages | `pnpm build` | root script alias = `pnpm -r --filter './packages/*' build` (apps/docs Docusaurus 제외) |
| Verify dist freshness | `grep -qE "\bverifyLicense\b|\bverifyGridLicense\b"` (mjs+cjs) | stale artifact 0 강제 |
| Verify license API exports | `grep -q "$sym" packages/grid-license/dist/index.mjs` | ADR-001 신 API 3종 export 확인 |

---

## 설계 결정

### 새 파일 (`build-verify.yml`) vs 기존 파일 추가

`visual-regression.yml` 에 추가하지 않은 이유:
- visual-regression 은 Playwright + Storybook 인프라 의존 — 빌드 실패와 다른 신호.
- 빌드 검증 실패 시 visual-regression step 에 묻히면 원인 파악 어려움.
- 분리된 job 이 PR checks 에서 독립적으로 표시됨.

### `pnpm build` vs `pnpm -r build`

- `pnpm -r build` 는 apps/docs (Docusaurus) 도 포함 → `customCss: []` pre-existing 오류로 CI 실패 (Wave 1 결과 §1 비고 확인).
- root package.json `"build"` script = `pnpm -r --filter './packages/*' build` — 안전한 alias.
- `pnpm build` 사용으로 13 packages 전체 PASS, apps/ 제외.

### grep 패턴 — `_verifyGridLicenseStub` 충돌 여부

`\bverifyGridLicense\b` 는 `_verifyGridLicenseStub` 에서 매치 안 됨:
- `_verifyGridLicenseS` — `e`(word) → `S`(word) 경계 없음 → `\b` 불충족.
- Wave 1 결과의 18건 의도적 유지 항목 모두 안전.

### .map 파일 제외

`dist/index.mjs`, `dist/index.cjs` 만 검사. `.map` 소스맵은 패턴 false-positive 위험 있음.

---

## 검증 결과 (Wave 3 실행 전 — 현 dist 상태)

Wave 1 + Wave 2 rebuild 이후 dist 상태 확인 (2026-05-17):

| 패키지 dist | `verifyLicense\b` | `verifyGridLicense\b` | `useLicenseStatus` |
|------------|-------------------|-----------------------|--------------------|
| grid-license | 0 | 0 | ✅ 존재 |
| grid-pro-agg | 0 | 0 | — |
| grid-pro-datamap | 0 | 0 | — |
| grid-pro-header | 0 | 0 | — |
| grid-pro-master | 0 | 0 | — |
| grid-pro-merging | 0 | 0 | — |
| grid-pro-range | 0 | 0 | — |
| grid-pro-tracking | 0 | 0 | — |
| (나머지 5 MIT 패키지) | 0 | 0 | — |

`useWatermarkEnforcement`, `subscribeLicense` 도 `packages/grid-license/dist/index.mjs` 에 존재 확인.

---

## 결과 체크리스트

- [x] CI yml 신규 생성 (`.github/workflows/build-verify.yml`)
- [x] `pnpm build` 단계 (13 packages, apps/ 제외)
- [x] dist freshness 검증 단계 (`verifyLicense\b`, `verifyGridLicense\b` → 0 강제)
- [x] ADR-001 신 API export 검증 단계 (`useLicenseStatus`, `useWatermarkEnforcement`, `subscribeLicense`)
- [x] ADR-015 본문 상태 amendment (`partial → Wave 1+3 통합 완료`)
- [x] dist 현 상태 확인 — 모든 패턴 0건 (Wave 3 단계가 실 실행 시 PASS 예상)

---

## 알려진 한계

1. **CI 실 실행 검증 미수행**: `topvel-grid-monorepo` 에 `.git` 디렉토리 없음 (Wave 1 결과 §3 확인). GitHub Actions 트리거는 git repo 화 및 remote push 후에만 가능. yml 구조 + 패턴은 검증 완료.
2. **actionlint 미수행**: 도구 미설치. YAML 들여쓰기는 visual-regression.yml 패턴 그대로 준용하여 수작업 검증.
3. **`pnpm size-limit` 미포함**: ADR-015 범위 외. dist 사이즈 검증은 별도 ADR (ADR-011 `.size-limit.json` 정책 통일) 에서 처리.
4. **apps/docs Docusaurus 빌드 실패 미해결**: CI 에서 제외로 우회. 별도 추적 필요 (Wave 1 결과 §2 확인).
