# 모노레포·패키징 인프라 모듈 (MOD-GRID-00)

topgrid 제품을 구성하는 **패키지 분할 구조와 빌드/배포 파이프라인**을 정의하는 모듈.
개별 그리드 기능이 아니라, 그 기능들이 어떻게 npm 패키지로 쪼개지고(MIT vs Pro),
어떻게 빌드되며(tsup dual format), 소비자 앱과 어떤 의존성 계약(peerDependencies)을
맺고, 어떤 번들 예산 안에서 관리되는지를 다룬다.

- pnpm 워크스페이스 모노레포: `packages/grid-*` 13개 + `apps/docs` 문서 앱.
- npm scope: `@topgrid/*`.
- 라이선스 분리: MIT 패키지(핵심·표현·유틸)와 Pro EULA 패키지(고급 기능)를 별도 npm
  패키지로 출하하고, 메타 패키지 `@topgrid/grid` 가 전체를 aggregate 한다.

---

## 1. 패키지 카탈로그

| npm 패키지 | 디렉토리 | tier | 역할 |
|-----------|---------|------|------|
| `@topgrid/grid-core` | `packages/grid-core` | MIT | TanStack Table 추상화 wrapper + `useGridState` 코어 훅 |
| `@topgrid/grid-renderers` | `packages/grid-renderers` | MIT | 셀 렌더러(Text/Number/Date/Badge/Button/Check/Link/Icon 등) |
| `@topgrid/grid-export` | `packages/grid-export` | MIT | Excel/PDF/CSV export |
| `@topgrid/grid-features` | `packages/grid-features` | MIT | 컬럼 재정렬 + 다중정렬 + 필터/날짜 UI |
| `@topgrid/grid-pro-tracking` | `packages/grid-pro-tracking` | Pro | ChangeTracking + Mapping + Validator |
| `@topgrid/grid-pro-range` | `packages/grid-pro-range` | Pro | Cell Range Selection + Drag-fill + Clipboard |
| `@topgrid/grid-pro-datamap` | `packages/grid-pro-datamap` | Pro | DataMap (foreign key 표시) |
| `@topgrid/grid-pro-merging` | `packages/grid-pro-merging` | Pro | Cell Merging (rowSpan) |
| `@topgrid/grid-pro-header` | `packages/grid-pro-header` | Pro | Multi-row Header (Column Groups) |
| `@topgrid/grid-pro-agg` | `packages/grid-pro-agg` | Pro | Aggregation (group footer) |
| `@topgrid/grid-pro-master` | `packages/grid-pro-master` | Pro | Master-Detail + TreeGrid + Context Menu |
| `@topgrid/grid-license` | `packages/grid-license` | Pro | Pro 라이선스 검증 런타임 |
| `@topgrid/grid` | `packages/grid` | Pro (meta) | 메타 패키지 — 전 패키지 aggregate facade |

- MIT 패키지: `license: "MIT"`. Pro 패키지·메타: `license: "SEE LICENSE IN EULA"`.
- `apps/docs` 는 npm 배포 대상이 아닌 문서/스토리북 앱(`private`).
- 모든 배포 대상 패키지는 `publishConfig.access: "public"` 으로 공개 배포 가능 상태다
  (Pro 패키지도 라이선스는 EULA 이지만 npm 레지스트리에는 public 으로 게시된다 —
  소스 공개 여부와 레지스트리 공개 여부는 별개. 라이선스 강제는 런타임 검증이 담당).

### 패키지 분할 원칙

핵심(MIT)과 고급 기능(Pro)을 **별도 npm 패키지**로 분리하고, 메타 패키지가 전체를
재export 한다. 이는 AG Grid (`ag-grid-community` MIT + `ag-grid-enterprise` 상용)와
동일한 구조다. 분리의 이점:

- 라이선스 모델 분리: MIT 소비자는 Pro 코드를 받지 않는다.
- 독립 버전 관리: 패키지별 semver/CHANGELOG 가 서로 무관하게 진행된다.
- 번들 효율: 소비자는 실제로 쓰는 패키지만 설치 → 미사용 Pro 기능이 번들에 들어오지 않는다.

---

## 2. 빌드·패키징 (tsup dual format)

전 패키지는 **tsup** (esbuild 기반)으로 빌드되며, 각 패키지의 `build` 스크립트는 `tsup`
한 단어다. 산출물은 패키지당 다음 3종을 dual format 으로 낸다.

| 산출 | 경로 | 용도 |
|------|------|------|
| ESM | `dist/index.mjs` | `import` (`exports.import`) |
| CJS | `dist/index.cjs` | `require` (`exports.require`) |
| 타입 | `dist/index.d.ts` | 타입 정보 (`exports.types`) |

각 `package.json` 은 `main`/`module`/`types` + `exports` 맵을 모두 채워 CJS/ESM/타입
소비를 동시에 지원한다.

### tsup 설정 (패키지 공통)

```ts
export default defineConfig({
  entry: ['src/index.ts', /* + 패키지별 sub-entry */],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
  external: [
    'react', 'react-dom',
    '@tanstack/react-table', '@tanstack/react-virtual',
    'xlsx', 'jspdf', '@dnd-kit/core', '@tanstack/react-query',
  ],
});
```

- `format: ['cjs', 'esm']` + `outExtension` 로 `.cjs`/`.mjs` 확장자를 명시 산출한다.
- `splitting: false` — 패키지당 단일 진입 파일 출력(단순성).
- `external` 배열은 **peerDependencies 의 빌드 측 반영**이다. peer 로 선언한 라이브러리는
  번들에 포함하지 않고 소비자 앱의 설치본을 쓰게 한다. 미설치 라이브러리는 tree-shake 로
  제거되므로 목록에 미래 peer 후보를 미리 넣어도 무해하다.

### 서브패스 진입점 (sub-entry exports)

일부 패키지는 메인 진입점 외에 추가 entry 를 노출한다. 예: `@topgrid/grid-core`

```json
"exports": {
  ".": { "types": "...", "import": "...", "require": "..." },
  "./legacy": { ... },
  "./internal/storage": { ... }
}
```

- `./legacy` — 하위호환 진입점. 메인 API 와 분리해 import 한 소비처만 legacy 코드를 받는다.
- `./internal/storage` — sister 패키지(예: `@topgrid/grid-pro-master`)와 공유하는 내부
  SSR/JSON I/O primitive. **semver-stable public API 가 아니다** — 내부 공유용이며 외부
  소비자 계약 대상이 아니다.

서브패스 분리의 목적은 tree-shaking 입자도를 높이는 것이다 — 소비처가 `/legacy` 를
import 하지 않으면 해당 코드가 메인 번들에 섞이지 않는다.

---

## 3. 의존성 계약 (peerDependencies)

`react` / `react-dom` / `@tanstack/react-table` 같은 런타임 의존은 **peerDependencies**
로 선언하고, `dependencies` 로 중복 선언하지 않는다. 소비자 앱이 자신의 react 단일
설치본을 쓰도록 보장하기 위함이다.

### 왜 peer 인가

peer 미선언 상태로 소비자가 패키지를 설치하면 react 가 번들에 포함될 수 있고, 소비자 앱의
react 와 **두 인스턴스**가 공존해 hooks 규칙 위반·오작동을 일으킨다. peer 선언은 (1) react
중복 번들 방지, (2) 버전 불일치 조기 경고(`pnpm install` WARN), (3) AG Grid/Wijmo 등 React
그리드 표준 패턴과의 정합을 동시에 달성한다. 이 정책은 위 §2 의 tsup `external` 배열과
일관되게 유지된다.

### peer 버전 매트릭스 (SSoT)

버전 범위는 실측 버전보다 **넓게**(라이브러리 브로드니스) 선언해 소비자 버전 유연성을 둔다.

| peer | 범위 | 적용 | optional |
|------|------|------|----------|
| `react` | `^18.0.0 \|\| ^19.0.0` | 전 패키지 | 필수 |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` | 전 패키지 | 필수 |
| `@tanstack/react-table` | `^8.0.0` | grid-license 외 전 패키지 | 필수 |
| `@tanstack/react-virtual` | `^3.0.0` | grid-core(필수) 외 일부 패키지 | 대부분 optional |
| `xlsx` | `^0.18.5` | grid-export(**필수**), meta(optional) | 패키지별 상이 |
| `jspdf` | `^2.5.0` | grid-export, meta | optional |
| `jspdf-autotable` | `^3.5.0` | grid-export, meta | optional |
| `date-fns` | `^4.1.0` | grid-features 전용 | 필수 |
| `react-datepicker` | `^8.3.0` | grid-features 전용 | 필수 |

패키지별로 다른 핵심 포인트:

- **grid-export**: `xlsx` 가 **필수 peer**(`peerDependenciesMeta.xlsx.optional: false`).
  Excel export 가 기본 기능이기 때문이다. PDF 계열(`jspdf`, `jspdf-autotable`)은 optional —
  미설치 소비자는 PDF 만 못 쓴다. (메타 패키지에서는 xlsx 도 optional 로 완화된다.)
- **grid-features**: DatePicker 기능을 위해 `date-fns` + `react-datepicker` 를 peer 로 둔다.
- **grid-license**: react/react-dom peer 만 선언(react-table 미사용).

### 패키지 간 의존 (workspace)

런타임 외부 peer 와 별개로, 일부 패키지는 같은 모노레포의 다른 패키지에 의존한다.

- Pro 패키지는 일반적으로 `@topgrid/grid-core` 위에 빌드되며, 라이선스 검증을 위해
  `@topgrid/grid-license` 에 의존한다.
- 메타 패키지 `@topgrid/grid` 는 전 sub-package 를 `dependencies: "workspace:*"` 로
  aggregate 한다(peer-only 가 아님) — facade 로서 모든 하위 패키지를 직접 끌어와 재export.
- 워크스페이스 패키지 간 참조는 `workspace:*` 로 선언한다. 일부는 빌드 순서 보장(pnpm 의
  topological build 가 peerDep 만으로는 보장되지 않음)을 위해 `devDependencies` 에도
  동일 패키지를 중복 선언한다.

---

## 4. 번들 예산 (size-limit)

패키지별 번들 한도를 `.size-limit.json` 에 선언하고 `size-limit`
(`@size-limit/preset-small-lib`)로 측정한다. 측정 기준은 **brotli** 압축이며, peer
라이브러리(react/tanstack/xlsx/jspdf 등)는 `ignore` 처리해 자체 로직만 잰다. CI 에서
한도 초과 시 exit 1 로 병합을 차단할 수 있다.

| 패키지 | 한도(brotli) |
|--------|-------------|
| `@topgrid/grid-core` | 30 KB |
| `@topgrid/grid-renderers` | 12 KB |
| `@topgrid/grid-export` | 20 KB |
| `@topgrid/grid-features` | 20 KB |
| `@topgrid/grid-pro-*` (7개) | 각 20 KB |
| `@topgrid/grid` (meta) | 150 KB |

- 측정 대상은 빌드 산출 `dist/index.mjs` — `size-limit` 실행 전 `pnpm -r build` 선행 필수.
- `grid-license` 는 `.size-limit.json` 대상에서 제외(총 12 엔트리).
- **예산 원칙**: 새 기능 추가 시 번들 영향을 이전 작업에서 외삽하지 않고 추가 직후 실측한다.
  같은 종류의 변경이라도 efficiency 편차가 커서(작은 헬퍼 추가는 거의 0에 가깝고, 컴포넌트
  트리 추가는 크다) 단일 평균 적용이 위험하기 때문이다. 한도 상향은 측정 결과에 근거해서만
  한다.

---

## 5. TypeScript strict 정책

라이브러리 코드는 소비자 타입 안전성을 위해 앱보다 엄격한 컴파일 옵션을 쓴다. 공유
`tsconfig.base.json` 을 전 패키지가 `extends` 하며, 핵심 옵션은:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "exactOptionalPropertyTypes": true,
  "skipLibCheck": false,
  "isolatedModules": true,
  "verbatimModuleSyntax": true,
  "moduleResolution": "bundler"
}
```

- `noImplicitAny: true` — 라이브러리는 `any` 를 금지한다. ESLint 의
  `@typescript-eslint/no-explicit-any: 'error'` 가 이를 빌드 전에 강제한다.
- `skipLibCheck: false` — d.ts 오류를 숨기지 않는다. 숨기면 소비자 빌드가 깨질 수 있다.
- `exactOptionalPropertyTypes: true` — optional prop 에 `undefined` 명시 할당을 구분한다.
  (렌더러 등에서 optional prop 은 conditional spread 로 전달하는 패턴을 쓴다.)
- `isolatedModules` + `verbatimModuleSyntax` — tsup 빌드 및 타입 import 규칙과 일치.

타입체크는 tsup 빌드와 별개로 `tsc --noEmit` (각 패키지 `typecheck` 스크립트)로 수행한다 —
빌드는 tsup 이, 타입 검증은 tsc 가 담당한다.

---

## 6. 버전 관리·릴리스 (Changesets)

semver 와 CHANGELOG 자동화는 **Changesets** (`@changesets/cli`)로 관리한다.

```sh
pnpm changeset          # 변경 패키지 선택 + major/minor/patch 결정 → .changeset/*.md 생성
pnpm changeset version  # 버전 bump + 각 패키지 CHANGELOG.md 업데이트
pnpm changeset publish   # npm 게시
```

- 각 패키지는 독립 CHANGELOG.md 를 가지며 `changeset version` 이 자동 갱신한다.
- 패키지 버전은 기능 단위로 진행된다(예: core 0.1.0, export 0.2.0, features 0.3.0).
- 내부 패키지 버전 bump 는 소비 패키지에 patch 로 전파(`updateInternalDependencies: "patch"`).

ESLint 는 flat config(v9, 루트 `eslint.config.mjs`)로 모노레포 전체에 적용되며, 위 §5 의
`no-explicit-any: 'error'` 규칙으로 라이브러리 코드 품질 게이트 역할을 한다.

---

## 7. 핵심 설계 결정과 근거

### 7.1 빌드 도구 — tsup (vs rollup / vite library mode)
esbuild 기반 tsup 을 채택했다. `format: ['cjs','esm']` 한 줄로 dual format, `dts: true`
한 플래그로 타입 산출이 끝나 패키지당 설정이 ~15줄로 minimal 하다. rollup 은 동일 결과에
플러그인 5개+ 가 필요해 13개 패키지 유지보수 부담이 과도하고, vite library mode 는 `.cjs`
확장자·d.ts 산출에 별도 설정이 든다. tsup 은 esbuild 의 타입 narrowing 미지원을
`tsc --noEmit` 로 보완한다.

### 7.2 MIT/Pro 패키지 분리 + 메타 facade
핵심·표현·유틸은 MIT, 고급 기능은 Pro EULA 로 별도 패키지화하고 메타 패키지가 전체를
재export 한다. 라이선스 모델 분리, 독립 semver, 번들 효율을 동시에 얻는다. 소비자는 MIT
패키지만으로 기본 그리드를 구성하거나, 메타 패키지로 전체를 한 번에 가져올 수 있다.

### 7.3 peerDependencies 우선 + 버전 매트릭스 SSoT
react/react-dom/react-table 등을 peer 로 선언해 중복 번들과 react 이중 인스턴스를
방지한다. 버전 범위는 한 곳(매트릭스)에서 관리해 13개 패키지 drift 를 차단하고, 실측보다
넓은 범위로 선언해 소비자 유연성을 확보한다. tsup `external` 과 항상 일관되게 유지한다.

### 7.4 번들 예산 — 측정 우선
패키지별 brotli 한도를 두고 CI 에서 강제한다. 예산 소비는 추정·외삽하지 않고 변경 직후
실측한다. 변경 종류별 번들 efficiency 편차가 커서 단일 평균이 위험하기 때문이다.

### 7.5 라이브러리 strict — skipLibCheck 금지
앱(`skipLibCheck: true`)과 달리 라이브러리는 `skipLibCheck: false` + `noImplicitAny: true`
+ `exactOptionalPropertyTypes: true` 로 더 엄격하게 컴파일한다. 라이브러리 d.ts 의 오류는
숨기는 순간 소비자 빌드 실패로 전가되므로, 우회 없이 빌드 시점에 잡는다.

### 7.6 Pro 라이선스 검증 진입점
Pro 패키지는 `@topgrid/grid-license` 에 의존하며, 각 패키지 index 의 module-load 시점에
`checkLicense()` 를 호출해 Pro 라이선스를 검증한다. (라이선스 검증 런타임 자체의 명세는
`grid-license` 모듈 문서 참조.)

---

## 8. 소비 형태 요약

```sh
# 기본(MIT) 그리드
pnpm add react react-dom @tanstack/react-table @topgrid/grid-core @topgrid/grid-renderers

# Excel export (xlsx 필수)
pnpm add xlsx @topgrid/grid-export

# 전체(메타) — Pro 포함 facade
pnpm add @topgrid/grid
```

- peer 미설치 시 `pnpm install` WARN 으로 누락을 조기 경고한다(오류 아님 — 명시 설치 유도).
- ESM/CJS 양쪽 소비자 모두 `exports` 맵으로 자동 해석된다.
- Pro 기능 사용 시 추가로 Pro 라이선스 키 설정이 필요하다(grid-license 참조).
