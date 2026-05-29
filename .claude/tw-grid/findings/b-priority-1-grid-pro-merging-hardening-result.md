# grid-pro-merging hardening 결과

**실행일**: 2026-05-18
**상태**: completed

---

## 변경 요약

- `packages/grid-pro-merging/package.json` `devDependencies` 에 `@tomis/grid-core: "workspace:*"` 추가
- 목적: peerDep-only 선언으로 인한 pnpm topological build-order race 잠재 결함 해소 (grid-pro-master / grid-pro-tracking 패턴 동일 적용)

---

## 변경 파일

| 파일 | 변경 |
|------|------|
| `packages/grid-pro-merging/package.json` | `devDependencies` 신규 섹션 추가 — `@tomis/grid-core: "workspace:*"` |
| `pnpm-lock.yaml` | `pnpm install` 갱신 |

---

## Before / After 비교

**Before** — peerDep-only:
```json
"peerDependencies": {
  "@tomis/grid-core": "workspace:*"
}
// devDependencies 없음
```

**After** — grid-pro-master 패턴 적용:
```json
"peerDependencies": {
  "@tomis/grid-core": "workspace:*"
},
"devDependencies": {
  "@tomis/grid-core": "workspace:*"
}
```

---

## 검증

| 검증 | 명령 | 결과 |
|------|------|------|
| pnpm install | `pnpm install` (root) | PASS — symlink `packages/grid-pro-merging/node_modules/@tomis/grid-core` 생성 확인 |
| pnpm -r typecheck | `pnpm -r --filter './packages/*' exec tsc --noEmit` | PASS (EXIT=0, 출력 없음 = 0 오류) |
| pnpm -r build | `pnpm -r --filter './packages/*' build` | PASS (13/13 packages, grid-pro-merging DTS success) |
| pnpm -F docs build-storybook | `storybook build` | PASS (EXIT=0, built in 8.04s) |
| storybook entries | `storybook-static/index.json` | PASS — 227 entries (story: 215, docs: 12), regression 0 |
| merging stories 확인 | index.json 검색 | PASS — 5 entries (watermark 포함): `pro-merginggrid-watermark--with-invalid-license` 등 |

---

## 결과 체크리스트

- [x] devDep 추가 (`@tomis/grid-core: "workspace:*"`)
- [x] pnpm install PASS (symlink 생성 확인)
- [x] pnpm -r typecheck PASS
- [x] pnpm -r build PASS (13/13, regression 0)
- [x] build-storybook PASS (EXIT=0)
- [x] regression 0 — storybook entries 227 (Phase 6 infra fix #2 결과와 동일)

---

## 배경 (위험 근거)

Phase 6 infra fix #2 결과 문서 (`wave-residual-4-phase6-infra2-result.md`) 알려진 한계 항목:
> "grid-pro-merging 은 동일 latent race 가 존재하나 현재 실행에서는 PASS — 추후 ordering-stability hardening 고려 가능 (별도 cycle)"

`pnpm -r build` 는 `peerDependencies` 만으로는 topological 빌드 순서를 보장하지 않음.
`devDependencies` 에 `@tomis/grid-core` 를 추가해야 pnpm 이 `grid-core` 빌드 완료 후 `grid-pro-merging` DTS 빌드 순서를 보장함.
grid-pro-master, grid-pro-tracking 이 동일 패턴을 사용함 (전자는 초기부터, 후자는 Phase 6 infra fix #2 에서 수정).

---

## 참조

- Phase 6 infra fix #2 결과: `wave-residual-4-phase6-infra2-result.md`
- grid-pro-master 패턴 기준: `packages/grid-pro-master/package.json`
- grid-pro-tracking 수정 선례: Phase 6 infra fix #2 발견 #3
