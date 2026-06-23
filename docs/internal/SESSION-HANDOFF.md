# SESSION HANDOFF — 다음 세션 재개 가이드 (2026-06-20)

> 토픽그리드 제품화 라운드(W1 멀티프레임워크 · W2 엔터프라이즈 차트 · W3 React DX)가 **성숙 체크포인트**에 도달. npm 전부 live, CI 4중 게이트, 문서사이트 반영 완료. 이 문서가 다음 세션의 **단일 재개 진입점**.

## 1. 현재 상태 (한눈에)
- **W1**: grid headless 코어 + Vue 어댑터 — 완료·발행.
- **W2 차트**: 설계(ADR-003) → 구현(17타입) → 멀티프레임워크(React+Vue, 동일 grid-chart-core 엔진) → 발행 → BYO(ADR-003 R4) → 실브라우저 e2e → SSR 헬퍼 — **완결·발행**.
- **W3 DX**: 분석(93 prop·11 TanStack 누출·함정 인벤토리) → 함정 dev-warn(getRowId·virt+pinning·visibility·reorder+pagination) → 온보딩 createColumns 전환 → 타입누출 adapter(ADR-006 `toGridCell`/`toGridFilterColumn`) → 예제 앱 → align-optional → Next.js/SSR·BYO·차트 가이드 → CI 게이트 — **핵심 완료**.

## 2. npm live (최신 버전)
- **그리드 13패키지 = grid-core 1.0 lockstep, 전부 @1.0.0**(2026-06-21 발행): grid-core·grid(facade)·grid-features·grid-renderers·grid-sizing·grid-pro-{header,master,pivot,sheet,tracking,edit-plus,filter,serverside} **모두 @1.0.0**. (이전 0.x: grid-core 0.8.0·grid 0.11.0 등 → ADR-006 D3 + ADR-007 D1 breaking 동봉 major.) 비-lockstep(grid-core 무참조)은 현 버전 유지: grid-export@0.6.0·grid-pro-agg@0.4.0·grid-pro-{merging,datamap,range,chart,panel}@0.4.0·grid-license@0.3.0 등.
- **차트 4종**: grid-chart-core@0.1.0 · grid-pro-chart-enterprise@**0.4.0**(React) · grid-pro-chart-enterprise-vue@**0.4.0**(Vue, SSR 헬퍼 포함) · grid-license-core@0.1.0. 스파크라인 grid-pro-chart@0.4.0.
- **W1**: grid-core-headless@0.1.0 · grid-vue@0.1.0. publisher=travia71([[npm-publish-topgrid]]).

## 3. git / 게이트
- ~~미푸시 2 커밋(cdbd84b·32cfc94)~~ → **이미 푸시됨**(origin/main==`0f8d6b9` 시점). 
- **현 미푸시(2026-06-20 세션)**: `2850e14`(ADR-007 + 차트 SSR 비결정성 증명) + 본 핸드오프 갱신 커밋. **origin push=사용자**.
- **CI(추가됨, 다음 push서 첫 가동)**: `build-verify.yml`(빌드+dist+license+**유닛 `pnpm -r test`**) · **`e2e.yml`**(Vue+예제 실 chromium) · `visual-regression.yml`(storybook). 게이트 맵=`TESTING.md`. 로컬: `pnpm -r test`(유닛+vitest)·`pnpm test:e2e`(실브라우저)·`pnpm -F docs visual:test`.

## 4. 잔여 작업 (전부 비크리티컬, 결론까지 도달)
> 2026-06-20 세션서 ①②④ 처분·③ 배포 실행. 아래 상태 갱신 반영.

1. **F-F dev-warn**(reorder+pagination) = ✅✅ **발행 완료(2026-06-21)**: grid-core 1.0.0 에 동승 발행됨(소스 `devWarnings.ts shouldWarnReorderWithPagination` 이 1.0 빌드에 포함). "다음 substantive grid-core 변경과 동승" 조건이 1.0 major 로 충족됨. **미발행 누적 0**.
2. **차트 in-place SSR→hydrate** = ★**블로커 경험적 증명 완료**(2026-06-20): ECharts SVG class=`zr{instanceId}-cls-{n}`(instanceId=init마다 증가 전역 카운터) → 동일 option 두 렌더 byte-불일치, 서버 zr0↔클라 zrN 영구 mismatch. `ssr.test.ts` regression +2 고정·consumer-notes 정밀화. **실 Nuxt 환경 확보 시** 별도 트랙(보류 유지가 정직). (이미 발행: `renderChartToSvgString` + SSR-safe 컴포넌트 + 2 패턴.)
3. **문서사이트 배포**(outward·사용자): ✅ **2026-06-22 재배포 — 공개 문서를 내부 가이드 수준으로 상향**. `apps/docs/docs/getting-started.mdx`=내부 전체 가이드로 확장(75줄→586) + **신규 `api-reference.md`**(GridProps·GridHandle·useGridState·EditableCell·13패키지 export, 1.0 clean 콜백) + sidebars 등록. docusaurus build green(ko+en, MDX/링크 검증). `bash apps/docs/deploy.sh` 로 배포, `getting-started`·`api-reference` 200 검증. ★**패키지 수 표기 27 통일**(intro·architecture[표+mermaid]·getting-started·comparison·live-demos): 실측=무료 MIT 7(core·headless·renderers·features·sizing·export·vue) + 상용 20(파사드 1·라이선스 2·Pro 13·차트 4). 기존 21/MIT4/Pro14 오표기·facade·grid-license MIT 오분류 정정. ★docusaurus 함정: `intro.md` frontmatter `slug:/` → 링크는 `/`(not `./intro`), 아니면 broken-link 빌드 실패. ★**키리스 SSH 작동 확인**(BatchMode, whoami=topgrid)=비대화형 scp 가능. 재배포는 `pnpm --dir apps/docs build:site` 후 동일 명령. ★권한 영구해결(서버 root 1회 `sshd internal-sftp -u 0022`+`setfacl -Rb`)=상세 `apps/docs/DEPLOY.md`. ★**디자인 심도 구현·배포(2026-06-23)**: 기본 docusaurus 테마 → 제품 정합 blue 브랜드 전면 구현. `src/css/custom.css`(blue Infima 스케일·Pretendard 한글폰트·컴포넌트 폴리시) + `src/pages/index.tsx`(커스텀 랜딩: hero·기능카드 8·코드쇼케이스·CTA, `index.module.css`) + 로고/파비콘 SVG(`static/img/`) + config(navbar 로고·GitHub·footer·colorMode·SEO). ★`intro.md` slug:/ 제거→루트는 랜딩, intro=/intro. ★`/storybook/`=정적 디렉터리라 `pathname://` 로 broken-link 우회 필수. 라이트/다크/문서·라이브 스크린샷 검증, GitHub 링크(alladins/topgrid) 200 공개 확인. ★**영문(en) 로케일 전면 번역·배포(2026-06-23)**: `/en/` 한국어 폴백 → 완전 영문화. `i18n/en/` 테마 JSON(navbar·footer·current) + 전 문서 12개 번역(`docusaurus-plugin-content-docs/current/`, 병렬 서브에이전트, 코드블록·링크·frontmatter 보존) + 랜딩 `index.tsx` currentLocale KO/EN 분기. ★`write-translations --locale en` 으로 JSON 키 스캐폴드 생성 후 값 번역. ★번역 함정: 헤딩 번역 시 in-page 앵커(`](#한글)`) 깨짐→영문 앵커로 수정(onBrokenAnchors=warn, deprecated-aliases 1건). 빌드 green(ko+en), 라이브 /en/ 영어 서빙 확인(KO 누출 0).
4. **W3-6 컬럼 타입추론** = ✅✅ **grid-core 1.0.0 발행 완료(2026-06-21)**. ADR-007 D1(키 안전 discriminated union, 데이터바운드 10종 id=keyof TData 강제·checkbox만 string) + **ADR-006 D3 동봉**(콜백 clean화: onCellClick/KeyDown/Tooltip→`GridCellContext`, cellClassName→`GridCellContext`, renderFloatingFilter→`GridFilterColumn`)을 **같은 major 1회**로 발행. 13-패키지 lockstep 1.0.0(grid-core·grid·features·renderers·sizing·pro-{header,master,pivot,sheet,tracking,edit-plus,filter,serverside}). 검증=typecheck+전 워크스페이스 node/vitest+**chromium full-suite 132/132 green**(2026-06-22 전체 기능 회귀 재확인=1.0 major 무회귀 입증; 발행시점엔 affected 13만, 이후 전체 재실행)·pack-verify leak 0·consumer smoke clean. 런타임 불변(타입+adapter 배선만). ★**외부 소비자 통합 스모크 통과(2026-06-22)**: 모노레포 밖 fresh Vite/React19 앱에서 `npm i @topgrid/grid@1.0.0`(ERESOLVE 0·grid-core deduped) → `tsc -b`(발행 .d.ts 타입체크, ★오타키 `@ts-expect-error` 충족=키안전 ADR-007 D1 실증) → `vite build`(885 모듈 번들) → 렌더 스모크(행 렌더+셀클릭 clean 콜백 `GridCellContext` 동작) **전부 green** = 1.0 이 외부 프로젝트에서 install→build→run 가능 입증. type↔value 정합(ADR-007 D2)=수요 게이트 후속 ADR. ★발행 표면 실측=가시 소비자 31 호출부 breaking 0건(PTLPSM=세션 권한 밖, grid-core CHANGELOG 1.0.0 마이그레이션 가이드로 커버).
5. (선택) W3 추가 함정(F-C는 이미 warn) · toolbar 17타입 노출 폴리시 · PTLPSM Vue 차트 실통합(담당자 몫, 우리는 불안정 통지).

## 5. canonical 상세 위치 (재-derive 금지)
- W2 차트 전체 = `ROADMAP-MULTIFRAMEWORK-CHART.md` §3 (단계①~③·발행·BYO·e2e·SSR).
- W3 DX 전체 = `W3-DX-FRICTION-ANALYSIS.md` (특히 **§10 잔여 disposition**).
- ADR = `.claude/dev-harness/decisions/ADR-003~006` + ID-LEDGER.
- 발행절차 = [[npm-publish-topgrid]] (수동 bump·pnpm pack ×N·topo publish·net-new 전파 ~3.5분).
- 게이트 = `TESTING.md`. 배포 = `apps/docs/DEPLOY.md` + [[docs-site-hosting]].

## 6. ★Windows 로컬 주의 (반복 함정)
- **포트 6006 = Hyper-V 예외대역(5975-6074)** → 비주얼 스위트는 자유포트(9009)+throwaway playwright config, e2e=9011/9013(예외대역 밖).
- **storybook 빌드**: `Tee-Object` 로그파일 락으로 반복 실패 가능 → 태스크 자체 output 사용(Tee 회피).
- **lockstep 발행**: 수동 bump(★`changeset version` 금지=major-escalation [[changeset-peerdep-major-escalation]]) → pnpm install → build topo → `pnpm -r test` → **pnpm pack ×N 누출/구체핀 검증** → topo publish(grid-core→…→facade) → 스모크(단일 grid-core 버전 deduped 확인).
- 세션 권한 = **topgrid 전용**([[session-scope-topgrid-only]]). TOMIS/PTLPSM/kforc 서버 = 타 세션·담당자.
