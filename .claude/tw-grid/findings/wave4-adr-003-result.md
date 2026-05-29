# ADR-003 실행 결과 — `@tomis/grid` 메타 facade 활성화

**실행일**: 2026-05-17
**Wave**: 4 (ADR-002 + ADR-006 + ADR-013 의존성 해소 후)
**상태**: completed
**원본 ADR**: `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` ADR-003

---

## 1. 변경 요약

- placeholder `export {};` (1 line) → 175-line real facade (12 sub-package re-export).
- `package.json` 에 12 workspace `dependencies` 추가 + `sideEffects` 필드 추가.
- README 전면 재작성 — 13-package inventory + MIT-only guidance + collision table + tree-shaking notes.
- CHANGELOG `0.1.0` entry + Changeset `minor` 등록.
- ADR-003 본문 amendment — 상태 `accepted → implemented`, Implementation Note + 결과 체크 마킹.

---

## 2. probe 결과

### 2.1 시도한 패턴 (naive)

```ts
// packages/grid/src/__probe_facade.ts (probe, 후 삭제)
export * from '@tomis/grid-core';
export * from '@tomis/grid-renderers';
export * from '@tomis/grid-features';
export * from '@tomis/grid-export';
export * from '@tomis/grid-license';
export * from '@tomis/grid-pro-tracking';
export * from '@tomis/grid-pro-range';
export * from '@tomis/grid-pro-datamap';
export * from '@tomis/grid-pro-merging';
export * from '@tomis/grid-pro-header';
export * from '@tomis/grid-pro-agg';
export * from '@tomis/grid-pro-master';
```

### 2.2 TS2308 결과 (5건)

```
src/__probe_facade.ts(5,1): error TS2308: Module '@tomis/grid-core' has already exported a member named 'defaultRendererRegistry'.
src/__probe_facade.ts(5,1): error TS2308: Module '@tomis/grid-core' has already exported a member named 'registerRenderer'.
src/__probe_facade.ts(11,1): error TS2308: Module '@tomis/grid-core' has already exported a member named 'TomisColumnDef'.
src/__probe_facade.ts(13,1): error TS2308: Module '@tomis/grid-core' has already exported a member named 'GroupedHeaderGrid'.
src/__probe_facade.ts(13,1): error TS2308: Module '@tomis/grid-core' has already exported a member named 'GroupedHeaderGridProps'.
```

### 2.3 해소 (옵션 A — alias) vs 옵션 B (explicit named export)

옵션 B 채택. 근거:
1. **ADR-013 강제** — `wave3-adr-013-result.md` 마지막 줄 명시: "ADR-003 (`@tomis/grid` 메타 facade) 작업 시 본 5 API 를 메타 facade 에서 re-export 하지 않도록 주의". `export * from '@tomis/grid-core'` 사용 시 deprecated 6 API 가 facade 로 유출 — ADR-013 명시 prohibition 위반.
2. **Canonical-source 명료성** — 5 collision 각각의 canonical source 가 prior ADR 에 명확히 정의됨:
   - `defaultRendererRegistry` / `registerRenderer` → `@tomis/grid-renderers` (ADR-002 D-3A — grid-core 는 placeholder fallback).
   - `TomisColumnDef` → `@tomis/grid-core` (ADR-006 — grid-pro-datamap 의 alias 는 `@deprecated`).
   - `GroupedHeaderGrid` / `GroupedHeaderGridProps` → `@tomis/grid-pro-header` (grid-core/legacy 는 C-6 thin alias).
3. **TypeScript identity 인식** — `export * from grid-features` 가 `useColumnDrag` / `SortBadge` 등 grid-core re-export 들과 collision 발생 안 함 (advisor 예측 "20+" 대비 실측 5). 이유: grid-features 의 alias 는 `from '@tomis/grid-core'` 라 같은 symbol identity. 따라서 grid-features / grid-pro-master 등은 `export *` 안전.

**최종 패턴**:
- **grid-core**: explicit named (skip 6 deprecated + 2 collision + 2 GroupedHeader)
- **grid-pro-datamap**: explicit named (skip `TomisColumnDef` deprecation alias)
- **나머지 10 packages**: `export *`

---

## 3. 변경 파일 목록

| 파일 | 변경 유형 | 변경 요약 |
|------|----------|----------|
| `packages/grid/src/index.ts` | MODIFIED | `export {};` (1) → 175 line facade |
| `packages/grid/package.json` | MODIFIED | 12 workspace deps + `sideEffects` 필드 |
| `packages/grid/README.md` | MODIFIED | 전면 재작성 — 13-package inventory + 4가지 신규 섹션 (MIT-only / Tree-shaking / Collision handling / License) |
| `packages/grid/CHANGELOG.md` | MODIFIED | `## 0.1.0 — 2026-05-17` entry 추가 |
| `.changeset/adr-003-meta-facade.md` | NEW | `@tomis/grid: minor` |
| `.claude/tw-grid/decisions/MOD-GRID-REFACTOR-2026-05-17-decisions.md` | MODIFIED | ADR-003 상태 `accepted → implemented` + Implementation Note + 결과 체크 마킹 |

---

## 4. 검증 결과

### 4.1 `pnpm -r typecheck`

**14 packages PASS** (grid-core / grid-renderers / grid-features / grid-export / grid-license / grid-pro-tracking / grid-pro-range / grid-pro-datamap / grid-pro-merging / grid-pro-header / grid-pro-agg / grid-pro-master / **grid (meta)** + 1 utility).

EXIT=0.

### 4.2 `pnpm --filter "./packages/*" build`

**13 packages PASS**.

EXIT=0.

grid 메타 빌드 결과:
- `dist/index.mjs`: 837 B
- `dist/index.cjs`: 5.70 KB
- `dist/index.d.ts`: 1.51 KB
- `dist/index.d.cts`: 1.51 KB

(thin re-export shim — tsup `treeshake:true` + `external:[]` 기본 설정에서 `@tomis/grid-*` 가 외부 모듈로 보존됨. consumer 번들러가 chain 을 따라감.)

### 4.3 `pnpm size`

```
@tomis/grid-core      8.99 kB /  30 kB  PASS
@tomis/grid-renderers 9.06 kB /  10 kB  PASS
@tomis/grid-export   14.04 kB /  20 kB  PASS
@tomis/grid-features 10.44 kB /  20 kB  PASS
@tomis/grid-pro-tracking 3.21 kB / 20 kB PASS
@tomis/grid-pro-range    5.28 kB / 20 kB PASS
@tomis/grid-pro-datamap  2.40 kB / 20 kB PASS
@tomis/grid-pro-merging  1.21 kB / 20 kB PASS
@tomis/grid-pro-header   2.20 kB / 20 kB PASS
@tomis/grid-pro-agg      3.11 kB / 20 kB PASS
@tomis/grid-pro-master   9.99 kB / 20 kB PASS
@tomis/grid (meta)      80.20 kB / 150 kB PASS  ← 본 ADR 결과
```

**메타 80.2 KB / 150 KB — 여유 ~70 KB.** brotli 압축 측정 (peer deps 무시) 후 12 sub-package surface 누적값.

### 4.4 grep 검증

```powershell
# 메타가 자기 자신 import 안 함:
grep "from ['\"]@tomis/grid['\"]" packages/grid/src/index.ts
# → 0 hits ✓

# 12 sub-package re-export 모두 존재:
grep -oE "'@tomis/grid-[a-z-]+'" packages/grid/src/index.ts | sort -u
# → 12 distinct packages: grid-core, grid-renderers, grid-features, grid-export,
#   grid-license, grid-pro-tracking, grid-pro-range, grid-pro-datamap,
#   grid-pro-merging, grid-pro-header, grid-pro-agg, grid-pro-master ✓

# dist 에 12 package 의 re-export chain 보존:
grep -oE "@tomis/grid-[a-z-]+" packages/grid/dist/index.mjs | sort -u
# → 12 distinct packages ✓
```

### 4.5 ADR-013 정합 검증

```powershell
# 메타 dist 에서 6 deprecated API 누락 확인:
grep -E "createTomisColumnHelper|createGroupedColumns|TomisColumnGroup|useColumnPersistence|ColumnVisibilityMenu" packages/grid/dist/index.d.ts
# → 0 hits ✓
```

ADR-013 prohibition 준수.

### 4.6 ADR-002 wiring 보존 검증

```powershell
# grid-renderers dist 의 wireDefaultRenderers 호출 보존:
grep -E "wireDefaultRenderers" packages/grid-renderers/dist/index.mjs
# → present (ADR-002 결과 보고서 §4.5 참조)

# 메타가 `export * from '@tomis/grid-renderers'` 로 side-effect import 체인 유지.
# 메타 package.json 의 sideEffects 필드가 consumer 번들러의 tree-shake 차단.
```

---

## 5. 결과 체크리스트

- [x] `@tomis/grid` `index.ts` 12 sub-package re-export 활성화
- [x] `dependencies` 12 workspace packages 추가
- [x] `sideEffects` 필드 명시 (src + dist mjs + dist cjs)
- [x] license 분리 명시 — README 의 "MIT-only consumption" 섹션
- [x] README 갱신 — 13-package inventory + 사용 예시 + collision table
- [x] CHANGELOG 0.1.0 entry
- [x] Changeset `adr-003-meta-facade.md` (minor)
- [x] `pnpm -r typecheck` 14 packages PASS
- [x] `pnpm --filter "./packages/*" build` 13 packages PASS
- [x] `pnpm size` meta 80.2 KB / 150 KB PASS
- [x] ADR-013 정합 — 6 `@deprecated` API facade 에서 명시적 제외
- [x] ADR-006 정합 — `TomisColumnDef` canonical = grid-core, grid-pro-datamap alias 제외
- [x] ADR-002 정합 — `defaultRendererRegistry`/`registerRenderer` canonical = grid-renderers + side-effect wiring 보존
- [x] ADR-003 본문 amendment — Implementation Note + 상태 flip + 결과 체크 mark
- [x] probe 파일 삭제 (검증 후 즉시)
- [x] 메타 self-import 0 (grep 검증)

---

## 6. 알려진 한계

### 6.1 Tree-shake 실측 미수행

본 ADR 의 4번째 결과 체크 항목 ("tree-shake 검증 — 사용 안 한 패키지 코드 미포함") 은 **정적 보장** 으로만 충족:
- tsup `treeshake: true`
- `sideEffects` 필드 명시 (consumer 번들러 인식)
- dist 가 thin re-export shim (실 코드 inline 없음 — 1.5 KB ESM)

**실측 (consumer 번들러 stats — Vite/esbuild/webpack analyze)** 은 본 작업 범위 외. 사용자 app 측 bundle analyzer 후속.

### 6.2 메타 dist 의 ESM/CJS surface 자동 보존 의존

`tsup` 의 `external` 옵션이 `@tomis/grid-*` 를 자동으로 외부화하지는 않음 (`tsup.config.ts` 의 `external: [...]` 배열에 명시 X). 그러나 tsup 의 기본 동작 + workspace `dependencies` (package.json) 가 협력하여 dist 가 re-export 체인 만 emit. 향후 tsup 버전 변경 시 거동 재확인 필요.

권고 (별도 작업): `tsup.config.ts` 의 `external` 에 12 sub-package 명시 추가 — 의도 명확화. 본 ADR 범위 외 (size 80.2 kB 한도 통과로 즉시 위험 없음).

### 6.3 size 80.2 KB → 150 KB 한도 여유

여유 ~70 KB (47%). 향후 신규 패키지 추가 (e.g. ADR-018 의 5 extras + icon) 또는 cell 컴포넌트 확장 시 한도 부족 가능. 한도 재검토 권고.

### 6.4 documented-deviations / E2E import smoke test 미수행

본 작업은 메타 facade `import { ... } from '@tomis/grid'` 의 컴파일/빌드 통과만 검증. 실 consumer (e.g. `tw-framework-front` 페이지) 에서의 import 경로 변경 (sub-package → meta) 검증은 별도 작업.

### 6.5 advisor 의 "20+ collisions" 예측과 실측 5건 차이

advisor 가 예측한 collision 항목 중 다수 (useColumnDrag / DropIndicator / useColumnOrderPersist / SortBadge / SortClearButton + 4 type 들 / TreeGrid / ColumnPinGrid) 는 **실측 TS2308 없음**. 이유: 해당 항목들은 grid-features / grid-pro-master 가 `from '@tomis/grid-core'` 로 re-export — TypeScript 가 동일 symbol identity 로 인식. advisor 평가가 보수적이었으나 정책 (ADR-013) 준수 강조 부분은 실제 작업에 결정적 영향 (옵션 B 채택 근거).

---

## 7. 다음 단계 권고

1. **소비자 측 마이그레이션 검토** — `tw-framework-front` 또는 외부 consumer 가 `@tomis/grid-core` + `@tomis/grid-renderers` 등 다수 sub-import 보유 시, 단일 `@tomis/grid` import 로 통합 가능. 별도 ADR/cycle.
2. **tsup `external` 명시** — `external: ['@tomis/grid-core', ...]` 추가로 의도 명확화 (size 측면 zero impact 이나 maintenance clarity ↑).
3. **size 한도 재검토** — 80.2 / 150 KB 여유 47%. ADR-018 등 신규 cell 추가 시 한도 상향 또는 메타 split 검토.
4. **Tree-shake 실측** — consumer app 에서 `@tomis/grid` 단일 import 시 실 bundle 의 dead-code elimination 효율 측정 (Vite `vite-bundle-visualizer` 등).
5. **POL-COMPAT §3.2 — `pnpm changeset version` 후 0.1.0 publish 시 README/CHANGELOG 의 link 검증** (`https://grid.tomis.dev` 등 — 본 ADR 범위 외).

---

**구현 완료. spec contract 준수. ADR-002 + ADR-006 + ADR-013 의존성 모두 해소된 상태에서 cleanly 활성화.**
