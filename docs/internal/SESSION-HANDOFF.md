# SESSION HANDOFF — 다음 세션 재개 가이드 (2026-06-20)

> 토픽그리드 제품화 라운드(W1 멀티프레임워크 · W2 엔터프라이즈 차트 · W3 React DX)가 **성숙 체크포인트**에 도달. npm 전부 live, CI 4중 게이트, 문서사이트 반영 완료. 이 문서가 다음 세션의 **단일 재개 진입점**.

## 0. ★최신 세션(2026-07-03) — 라이선스 강화 + Vue Pro 지원 ★발행 완료
PTLPSM(Nuxt3/Vue3 출하관리) 도입 문의 대응 = ①공개키 핀 강화 → ②발급 CLI → ③Vue 피벗·서버사이드 지원 → **후속 옵션(VuePivotGrid·useVueServerSideTree) → npm 발행 완료.**
**★npm 발행(2026-07-03, additive)**: grid-license-core@**0.2.0**(핀·키 3→2파트) + grid-pro-pivot-core@**0.1.0** + grid-pro-serverside-core@**0.1.0** + grid-pro-pivot-vue@**0.1.0** + grid-pro-serverside-vue@**0.1.0**. 13-패키지 1.0.2 lockstep 미개입. React grid-pro-pivot/serverside(npm 1.0.2)의 코어 재배선은 다음 grid-core lockstep 동승. 신규 스코프 패키지명은 발행 후 읽기 CDN 전파 수 분(403 "cannot publish over"=확정). git origin push=사용자.
- **① 공개키 핀**(`5586141`): grid-license-core `verifySignature` 가 키 동봉 공개키(위조가능)→라이브러리 핀 `PINNED_PUBLIC_KEY` 로 검증. 키 3파트→2파트. 공개 API 불변. [[license-issuance-topgrid]].
- **② 발급 CLI**(`5586141`): `scripts/license/license.mjs`(keygen·sign·inspect)+selftest 5/5+README. Node webcrypto=브라우저와 동일 Ed25519. 개인키 `.private.key` gitignore.
- **③ Vue Pro**(`9083b27`·`cd78270`·`bb64b72`·`87bd5b1`): **-core 추출 + *-vue 신규**(chart-core 선례, Plan 6-Phase). grid-pro-pivot-core(78 test)·grid-pro-serverside-core(28)=순수 추출, React 표면 불변=비파괴. grid-pro-pivot-vue(useVuePivot·VuePivotPanel, 17)·grid-pro-serverside-vue(useVueServerSideData SSRM·useVueViewportRowModel, 15)=신규. Nuxt SSR 안전(컨트롤러 onMounted client-only). React peer 미유입(라이선스=grid-license-core). 상세 [[vue-pro-pivot-serverside]].
- **✅ 발행 완료**(위 참조). ★**핀 전파+코어 재배선 발행 완료(2026-07-03, `9cb1ca4`)**: grid-license 0.3.1(→core 0.2.0 핀) + React Pro 16패키지 patch(1.0.3/0.4.1). 이제 **모든 React Pro 가 위조 방지 핀 검증** 사용, pivot/serverside 는 -core 공유. npm 발행 17/17 검증됨.
- **✅ 후속 옵션 완료**: VuePivotGrid(vue-table 렌더 셸 + buildVuePivotColumns) + useVueServerSideTree(지연 그룹) 발행됨.
- **★패키지 수 변화**: 27→**31**(신규 4). 문서사이트 "27" 표기 갱신 필요(비크리티컬).
- **잔여(비크리티컬)**: ①문서사이트 31패키지 표기·Vue Pro 문서 추가 ②고객 답변 메일(Vue Pro 지원으로 §2 갱신) ③git origin push(사용자).

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
3. **문서사이트 배포**(outward·사용자): ✅ **2026-06-22 재배포 — 공개 문서를 내부 가이드 수준으로 상향**. `apps/docs/docs/getting-started.mdx`=내부 전체 가이드로 확장(75줄→586) + **신규 `api-reference.md`**(GridProps·GridHandle·useGridState·EditableCell·13패키지 export, 1.0 clean 콜백) + sidebars 등록. docusaurus build green(ko+en, MDX/링크 검증). `bash apps/docs/deploy.sh` 로 배포, `getting-started`·`api-reference` 200 검증. ★**패키지 수 표기 27 통일**(intro·architecture[표+mermaid]·getting-started·comparison·live-demos): 실측=무료 MIT 7(core·headless·renderers·features·sizing·export·vue) + 상용 20(파사드 1·라이선스 2·Pro 13·차트 4). 기존 21/MIT4/Pro14 오표기·facade·grid-license MIT 오분류 정정. ★docusaurus 함정: `intro.md` frontmatter `slug:/` → 링크는 `/`(not `./intro`), 아니면 broken-link 빌드 실패. ★**키리스 SSH 작동 확인**(BatchMode, whoami=topgrid)=비대화형 scp 가능. 재배포는 `pnpm --dir apps/docs build:site` 후 동일 명령. ★권한 영구해결(서버 root 1회 `sshd internal-sftp -u 0022`+`setfacl -Rb`)=상세 `apps/docs/DEPLOY.md`. ★**디자인 심도 구현·배포(2026-06-23)**: 기본 docusaurus 테마 → 제품 정합 blue 브랜드 전면 구현. `src/css/custom.css`(blue Infima 스케일·Pretendard 한글폰트·컴포넌트 폴리시) + `src/pages/index.tsx`(커스텀 랜딩: hero·기능카드 8·코드쇼케이스·CTA, `index.module.css`) + 로고/파비콘 SVG(`static/img/`) + config(navbar 로고·GitHub·footer·colorMode·SEO). ★`intro.md` slug:/ 제거→루트는 랜딩, intro=/intro. ★`/storybook/`=정적 디렉터리라 `pathname://` 로 broken-link 우회 필수. 라이트/다크/문서·라이브 스크린샷 검증, GitHub 링크(alladins/topgrid) 200 공개 확인. ★**영문(en) 로케일 전면 번역·배포(2026-06-23)**: `/en/` 한국어 폴백 → 완전 영문화. `i18n/en/` 테마 JSON(navbar·footer·current) + 전 문서 12개 번역(`docusaurus-plugin-content-docs/current/`, 병렬 서브에이전트, 코드블록·링크·frontmatter 보존) + 랜딩 `index.tsx` currentLocale KO/EN 분기. ★`write-translations --locale en` 으로 JSON 키 스캐폴드 생성 후 값 번역. ★번역 함정: 헤딩 번역 시 in-page 앵커(`](#한글)`) 깨짐→영문 앵커로 수정(onBrokenAnchors=warn, deprecated-aliases 1건). 빌드 green(ko+en), 라이브 /en/ 영어 서빙 확인(KO 누출 0). ★**경쟁사 브랜드 마스킹·재배포(2026-06-23)**: 전 표면 74파일·467건 — `XX Grid`→`XX Grid`(+케이스변종)·`xxxx`→`xxxx`, `FlexGrid`/`FlexSheet` 유지. 배포 docs(KO+EN)·발행 README·내부 분석문서·코드 주석·메모리 포함. 소스 잔존 0·라이브 comparison KO/EN 경쟁사명 0 검증. 상세·규칙=[[competitor-brand-masking]]. (★grid-pro-filter README republish 완료=아래 1.0.2 lockstep에 흡수.) ★**Storybook 데모 Tailwind 디자인 + 핀 z-index 버그 수정 + grid-core 1.0.2 lockstep 발행(2026-06-26)**: 데모 storybook이 Tailwind 미적용으로 그리드 무스타일이던 것 → apps/docs에 Tailwind v3 통합(tailwind/postcss config + .storybook/tailwind.css preview import + layout:padded + manager blue 테마) → 소비자처럼 정상 렌더, 배포 검증(라이브 header padding 15px). ★Tailwind가 가렸던 **진짜 z-index 버그 노출·수정**: 핀 body 셀(z-20)이 thead(z-10) 위로 깔려 컬럼메뉴 가림 → thead z-10→z-30·핀헤더 z-30→z-40·ColumnMenu z-30→z-50. 전체 chromium **132/132 green**(Tailwind 활성). grid-core 변경→**13-패키지 lockstep @1.0.2 발행**(exact-pin이 grid-core 패치도 패밀리 동반 강제; grid-pro-filter 1.0.1→1.0.2로 README마스킹도 흡수). pack-verify leak 0·소비자 smoke ERESOLVE 0·grid-core@1.0.2 deduped. ★교훈: 발행 라이브러리 z-index/sticky 버그는 Tailwind-less 하네스서 영구 은닉됨(데모에 Tailwind 주입이 드러냄).
4. **W3-6 컬럼 타입추론** = ✅✅ **grid-core 1.0.0 발행 완료(2026-06-21)**. ADR-007 D1(키 안전 discriminated union, 데이터바운드 10종 id=keyof TData 강제·checkbox만 string) + **ADR-006 D3 동봉**(콜백 clean화: onCellClick/KeyDown/Tooltip→`GridCellContext`, cellClassName→`GridCellContext`, renderFloatingFilter→`GridFilterColumn`)을 **같은 major 1회**로 발행. 13-패키지 lockstep 1.0.0(grid-core·grid·features·renderers·sizing·pro-{header,master,pivot,sheet,tracking,edit-plus,filter,serverside}). 검증=typecheck+전 워크스페이스 node/vitest+**chromium full-suite 132/132 green**(2026-06-22 전체 기능 회귀 재확인=1.0 major 무회귀 입증; 발행시점엔 affected 13만, 이후 전체 재실행)·pack-verify leak 0·consumer smoke clean. 런타임 불변(타입+adapter 배선만). ★**외부 소비자 통합 스모크 통과(2026-06-22)**: 모노레포 밖 fresh Vite/React19 앱에서 `npm i @topgrid/grid@1.0.0`(ERESOLVE 0·grid-core deduped) → `tsc -b`(발행 .d.ts 타입체크, ★오타키 `@ts-expect-error` 충족=키안전 ADR-007 D1 실증) → `vite build`(885 모듈 번들) → 렌더 스모크(행 렌더+셀클릭 clean 콜백 `GridCellContext` 동작) **전부 green** = 1.0 이 외부 프로젝트에서 install→build→run 가능 입증. type↔value 정합(ADR-007 D2)=수요 게이트 후속 ADR. ★발행 표면 실측=가시 소비자 31 호출부 breaking 0건(PTLPSM=세션 권한 밖, grid-core CHANGELOG 1.0.0 마이그레이션 가이드로 커버).
5. (선택) W3 추가 함정(F-C는 이미 warn) · toolbar 17타입 노출 폴리시 · PTLPSM Vue 차트 실통합(담당자 몫, 우리는 불안정 통지).

## 4.5 폴리시 라운드(2026-06-28, advisor-위임) + ★다음 release 흡수 번들
- ✅ 배포 완료(자율, npm 게이트 무관): ①`onBrokenMarkdownLinks`→`markdown.hooks.onBrokenMarkdownLinks`(빌드 deprecation 제거) ②OG 소셜 이미지(1200×630 PNG `static/img/og-image.png`+themeConfig.image, og:image/twitter:image 메타) ③`static/robots.txt`(sitemap 포인터, SEO). ④랜딩 라이브 그리드 데모(storybook iframe). 전부 라이브 검증.
- ✅ **banked(소스 committed, 2026-06-28 `3d79a6a`) — 다음 grid-core release의 lockstep republish에 자동 동승, 재작업 금지**: (a) 전 27 발행 package.json `keywords` 추가(npm SEO) (b) facade `@topgrid/grid` package.json에 `repository`/`bugs`/`homepage` 추가(grid-core 미러) (c) grid-core README 태그라인 benefit-oriented화. ★이들은 **발행 안 됨**(npm 게이트) — 다음 substantive grid-core 변경+13-패키지 lockstep 발행 시 자동 포함(★지금 banking 안 했으면 다음 release가 free ride를 태웠을 것). 잔여 cosmetic(미banking): facade README 내부 ADR-ID strip(선택).
- ✅ **패키지별 API 레퍼런스 한국어 자동 생성 완료·배포(2026-07-03, `588990c`)**: 사용자 요청 하이브리드(전용 생성기+한글 먼저+영어 별도) 구현. `apps/docs/scripts/gen-api.mjs` = typedoc 을 **JSON 추출기로만** 사용(docusaurus 플러그인 체인 미사용→버전 문제 우회) + 전용 렌더러(시그니처·설명·파라미터표·예시·@see, 내부 표식 정제, MDX 안전). 27패키지→`docs/api/*.md`(개요+27), 사이드바 '패키지별 API (자동 생성)' autogenerated. `pnpm --dir apps/docs gen:api` 로 재생성(API 소스 변경 시). 큐레이트 `api-reference.md` 는 그대로(하이브리드). ★**영어(i18n/en) 완료·배포(2026-07-03, `d0def71`)**: advisor 방식 A(서브에이전트가 생성된 KO 페이지를 EN 번역, 산문만·코드/MDX 이스케이프 보존·용어집 통일) 26패키지+개요→`i18n/en/.../current/api/*.md`, current.json에 카테고리 라벨 EN. ★**facade grid(491 export·전체 prose 57%·대부분 재export 중복) defer**=/en 은 KO 폴백(수용). 재번역=KO gen:api 후 변경 페이지만. ★MDX 함정: 산문 줄머리 `import/export`=ESM 오인(ZWSP 차단), 백틱 밖 `<`/`{` 이스케이프. ★품질=소스 TSDoc 이 풍부(@example 107·@param 193…)해서 손글씨급.

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
