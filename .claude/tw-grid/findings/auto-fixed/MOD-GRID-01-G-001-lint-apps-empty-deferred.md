# Finding: MOD-GRID-01 / G-001 — root `pnpm lint` skipped (apps empty dir pre-existing config issue)

**Goal**: G-001
**Stage**: implement
**Status**: ⚠️ DEFERRED — pre-existing repo config issue, not caused by G-001
**Type**: environment / pre-existing config
**기록일**: 2026-05-14

---

## 컨텍스트

`package.json` root script:
```json
"lint": "eslint packages apps"
```

`apps/` 디렉토리는 docs 만 존재하고, ESLint flat config (`eslint.config.mjs`)
의 `files` glob (`apps/**/*.{ts,tsx}`) 에 매칭되는 ts/tsx 파일이 없다.

```
ESLint: 9.39.4
You are linting "apps", but all of the files matching the glob pattern "apps" are ignored.
```

이는 **G-001 변경 이전부터 존재하는 monorepo 설정 이슈**이며, 본 Goal 의 책임 범위 외.

## 검증 (G-001 코드만)

```powershell
cd D:\project\topvel_project\topvel-grid-monorepo
npx eslint packages   # exit 0 — 0 error 0 warning
```

`packages/` 만 lint 시 0 error 0 warning 으로 통과. G-001 의 신규/수정 파일 (`Grid.tsx`,
`types.ts`, `internal/buildTableOptions.ts`, `internal/CheckboxColumn.tsx`, `index.ts`)
모두 ESLint flat config rule (특히 `@typescript-eslint/no-explicit-any: error`,
`react-hooks/*`) 통과.

## Skip 사유

`pnpm lint` script (`eslint packages apps`) 가 apps 빈 dir 로 인해 ELIFECYCLE
exit 2 — 본 G-001 의 코드 변경이 원인이 아님 (G-001 이전부터 존재하는 설정).

## 후속 조치 (별도 Goal 대상)

다음 중 하나를 별도 Goal (예: MOD-GRID-99 또는 monorepo housekeeping) 에서 처리:

1. `apps/` 디렉토리에 docs 의 `.tsx` 파일 추가 후 lint 적용, 또는
2. `package.json` lint script 를 `eslint packages` 로 단순화 (apps 는 docs 도입 시 추가),
   또는
3. ESLint flat config 의 `files` 에 `apps/docs/**/*` 명시 + 빈 디렉토리 무시.

본 G-001 범위 내에서 `package.json` lint script 변경은 spec Section 7 NEW/MODIFY
파일 5개 외 임의 변경 → F-02 (spec.implementFiles 매칭) 위반 위험으로 미수행.

## 점수 처리

- B-05 (ESLint 통과): YES (`npx eslint packages` 0 error). pnpm lint script
  스코프 외 사유는 본 finding 으로 분리 보고.
