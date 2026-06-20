# 테스트 게이트

topgrid 의 검증 계층 — 무엇이 어디서 도는지, 로컬·CI 매핑.

| 게이트 | 로컬 명령 | 무엇 | CI |
|--------|-----------|------|----|
| **타입체크** | `pnpm typecheck` | 전 패키지 `tsc --noEmit` | (build-verify 빌드에 내포) |
| **빌드** | `pnpm build` | 직렬 topo 빌드 + dist | `build-verify.yml` |
| **유닛** | `pnpm -r test` | node `--experimental-strip-types` 스파인(46+) + grid-core **vitest**(jsdom, @testing-library) | `build-verify.yml` (Run unit tests) |
| **e2e (실브라우저)** | `pnpm test:e2e` | Vue 차트 + 예제 앱 Playwright(chromium) — esbuild 번들 + webServer 자동기동 | `e2e.yml` |
| **비주얼 회귀** | `pnpm -F docs visual:test` | Storybook static + Playwright(컴포넌트/스토리) | `visual-regression.yml` |
| **번들 크기** | `pnpm size` | size-limit | (size-limit:ci) |
| **린트** | `pnpm lint` | eslint | — |

## 유닛 — node 스파인 + vitest 공존
- **순수 로직** = `node --experimental-strip-types <file>.test.ts`(인라인 assert, 빠름, DOM 무). 각 패키지 `test` 스크립트가 체인.
- **React 훅/컴포넌트** = grid-core `vitest`(jsdom + `@testing-library/react`). `packages/grid-core/vitest.config.ts`(globals:true=auto-cleanup, 6 파일 명시 include). grid-core `test` 끝에 `&& vitest run` 으로 편입 → `pnpm -r test` 가 둘 다 실행.

## e2e — 실브라우저 (수동→게이트 고정)
- **Vue 차트**(`packages/grid-pro-chart-enterprise-vue/e2e/`): render/layout/type-switch/export/cross-filter. `build:e2e`(esbuild) → Playwright(webServer 9011).
- **예제 앱**(`apps/example-react/e2e/`): facade end-to-end(createColumns·getRowId·toGridCell). `build:example` → Playwright(webServer 9013).
- 둘 다 happy-dom 이 못 잡는 **실 레이아웃·hit-testing**을 검증. `pnpm test:e2e` 로 일괄.
- ★Windows 로컬: 포트 6006 은 Hyper-V 예외대역(5975-6074) → 비주얼 스위트는 자유포트(9009)+throwaway config 로 우회. e2e 는 9011/9013 사용(예외대역 밖). CI(ubuntu)는 무관.

## SSR (브라우저 불필요)
- Vue 차트 `src/ssr.test.ts`(node): `renderChartToSvgString` headless + `@vue/server-renderer` renderToString SSR-safe. `pnpm -r test` 에 포함.
