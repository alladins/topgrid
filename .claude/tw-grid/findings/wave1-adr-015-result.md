# ADR-015 (Wave 1 부분) 실행 결과 — stale build sweep + JSDoc 옛 이름 정리

**실행일**: 2026-05-17
**Wave**: 1 (의존성 0 — dist rebuild + JSDoc 만)
**상태**: completed
**미실행 (Wave 3 이연)**: CI 검증 단계 추가 (ADR-001 결정 후 별도)

---

## 변경 요약

### dist rebuild
- `pnpm -r --filter './packages/*' build` 실행 (13 packages 전체 성공)
- `grid-pro-master/dist/index.mjs:1` — 빌드 전 `import { verifyLicense } from '@tomis/grid-license'` → 빌드 후 `import { checkLicense } from '@tomis/grid-license'`
- 검증: `grep "verifyLicense" packages/*/dist/` → 0건 (mjs + cjs 모두)

**`pnpm -r build` 비고**: 모노레포 루트 `pnpm -r build` 실행 시 `apps/docs` (Docusaurus) 가 `customCss: []` validation 오류로 실패. 이 오류는 본 ADR 범위 외 pre-existing 문제이며 packages/* 빌드와 무관. `--filter './packages/*'` 스코프로 13패키지 전체 PASS 확인.

### JSDoc sweep (grid-pro-range)

분석 보고서 §2.3 기준 4 파일 + 실 grep 시 추가 발견된 `RangeSelectGrid.tsx` 포함 총 5 파일 변경.

| 파일 | 변경 line | 기존 텍스트 | 신 텍스트 |
|------|----------|------------|----------|
| `useCellRange.ts` | 6 | `verifyGridLicense 선택적 호출 —` | `checkLicense 선택적 호출 —` |
| `useCellRange.ts` | 26 | `import { verifyGridLicense } from '@tomis/grid-license';` | `import { checkLicense } from '@tomis/grid-license';` |
| `useClipboard.ts` | 24 | `import { verifyGridLicense } from '@tomis/grid-license';` | `import { checkLicense } from '@tomis/grid-license';` |
| `useKeyboardEdit.ts` | 28 | `import { verifyGridLicense } from '@tomis/grid-license';` | `import { checkLicense } from '@tomis/grid-license';` |
| `useKeyboardNav.ts` | 20 | `import { verifyGridLicense } from '@tomis/grid-license';` | `import { checkLicense } from '@tomis/grid-license';` |
| `RangeSelectGrid.tsx` | 35 | `import { verifyGridLicense } from '@tomis/grid-license';` | `import { checkLicense } from '@tomis/grid-license';` |

**분석 보고서 대비 차이**: 보고서 §2.3 은 4 파일(useCellRange.ts:26, useClipboard.ts:24, useKeyboardEdit.ts:28, useKeyboardNav.ts:20) 을 나열. 실 grep 결과:
- `useCellRange.ts` 에 line 6 추가 1건 (보고서 미기재 — `verifyGridLicense 선택적 호출` 표현)
- `RangeSelectGrid.tsx:35` 추가 1건 (보고서 미기재 — 동일 import-snippet 패턴)

코드/import/로직 변경 0건. JSDoc 주석만 변경.

---

## 변경하지 않은 사항 (의도적 유지)

| 위치 | 내용 | 유지 이유 |
|------|------|----------|
| `_verifyGridLicenseStub` 함수명 (5 파일, 18건) | 로컬 stub 함수의 실제 이름 | 본 ADR 범위: "옛 API 이름" sweep. stub 이름 변경은 코드 변경 (Wave 1 밖) |
| `useCellRange.ts:11` — `declare const verifyGridLicense` | spec 원안의 broken 패턴을 설명하는 역사적 맥락 주석 | 수정하면 "왜 현재 방식으로 바꿨는가" 이유가 삭제됨 |
| `dist/*.map` 소스맵 내 `_verifyGridLicenseStub` | 빌드 산출물, 함수명 포함 | 빌드 프로세스에서 자동 생성됨 |

---

## 검증 결과

- `pnpm -r --filter './packages/*' build`: **PASS** (13 packages 전체)
  - `apps/docs` 실패는 Docusaurus pre-existing 설정 오류 (본 ADR 무관)
- `pnpm typecheck` (`pnpm -r --filter './packages/*' exec tsc --noEmit`): **PASS** (출력 0줄, exit 0)
- `grep "verifyLicense" packages/*/dist/` (mjs + cjs): **0 hits**
- `grep "verifyGridLicense" packages/` src + dist 잔재 분류:
  - `_verifyGridLicenseStub` 함수명: 18건 (의도적 유지 — 코드 변경 아님)
  - `declare const verifyGridLicense` (useCellRange.ts:11 역사 주석): 1건 (의도적 유지)
  - 옛 API 이름 import-snippet JSDoc: **0건** ✅

### 모노레포 git 추적 여부

`topvel-grid-monorepo` 는 git repository 가 아님 (`.git` 디렉토리 없음). 따라서 `dist/` 는 git 추적 대상 아님. dist rebuild 결과는 디스크에 반영되나 commit footprint 없음. "stale dist 재발 방지" 를 위해서는 Wave 3 의 CI build 단계 추가가 필요 (ADR-001 결정 후).

---

## 결과 체크리스트 (ADR-015 결과 절 매핑 — Wave 1 부분)

- [x] `pnpm -r build` 후 `grid-pro-master/dist/index.mjs` 에 `checkLicense` (verifyLicense 0건)
- [x] grep `verifyGridLicense` packages/grid-pro-range/ → 옛 API 이름 import-snippet 0건 (잔여는 `_verifyGridLicenseStub` 함수명 + 역사 주석 — 의도적 유지)
- [ ] CI yml 에 `pnpm -r build` + dist 검증 단계 추가 (Wave 3 이연 — ADR-001 결정 후)

**Wave 1 체크리스트 충족: 2/2 항목** (CI 통합은 Wave 3 — N/A)

---

## 추가 발견

1. **`RangeSelectGrid.tsx` 미기재**: 분석 보고서 §2.3 의 4 파일 목록에 `RangeSelectGrid.tsx` 가 빠져 있었음. 동일 import-snippet JSDoc 패턴이 존재하여 일괄 변경.
2. **`apps/docs` Docusaurus 빌드 실패**: Docusaurus 3.10.1 의 `customCss: []` validation 변경에 따른 pre-existing 실패. 본 ADR 변경과 무관. 별도 추적 필요.
3. **monorepo git 없음**: dist rebuild commit 불가. Wave 3 CI 통합이 "rebuild on every PR" 를 보장하는 유일한 방어선임을 재확인.

---

## 다음 단계

- ADR-001 (Wave 2 — license enforcement 방향 결정) 사용자 결정 후 ADR-015 후반부 (CI 통합) 실행
- `apps/docs` Docusaurus `customCss` 빌드 실패 별도 처리
