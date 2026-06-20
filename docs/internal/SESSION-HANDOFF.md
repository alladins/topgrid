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

1. **grid-core 미발행 누적 1건 = F-F dev-warn**(reorder+pagination). ✅ **점검 완료**(2026-06-20): 누적=정확히 1건·grid-core test green(42)=발행가능·push 우려 해소. dev-only라 단독 13-lockstep은 과함 → **hold 유지**(배치 임계 미도달, 다음 substantive grid-core 변경과 동승 발행).
2. **차트 in-place SSR→hydrate** = ★**블로커 경험적 증명 완료**(2026-06-20): ECharts SVG class=`zr{instanceId}-cls-{n}`(instanceId=init마다 증가 전역 카운터) → 동일 option 두 렌더 byte-불일치, 서버 zr0↔클라 zrN 영구 mismatch. `ssr.test.ts` regression +2 고정·consumer-notes 정밀화. **실 Nuxt 환경 확보 시** 별도 트랙(보류 유지가 정직). (이미 발행: `renderChartToSvgString` + SSR-safe 컴포넌트 + 2 패턴.)
3. **문서사이트 배포**(outward·사용자): ✅ **2026-06-20 세션 배포 실행**(`bash apps/docs/deploy.sh`). build/ 19M·412파일·storybook 임베드·소스보다 최신. 재배포는 동일 명령. ★403/권한정규화 영구해결: 서버 root 1회 `sshd Subsystem sftp internal-sftp -u 0022` + restart + `setfacl -Rb /var/www/topgrid` → 이후 scp 만으로 끝(상세 `apps/docs/DEPLOY.md`).
4. **W3-6 컬럼 타입추론** = ✅✅ **grid-core 1.0.0 발행 완료(2026-06-21)**. ADR-007 D1(키 안전 discriminated union, 데이터바운드 10종 id=keyof TData 강제·checkbox만 string) + **ADR-006 D3 동봉**(콜백 clean화: onCellClick/KeyDown/Tooltip→`GridCellContext`, cellClassName→`GridCellContext`, renderFloatingFilter→`GridFilterColumn`)을 **같은 major 1회**로 발행. 13-패키지 lockstep 1.0.0(grid-core·grid·features·renderers·sizing·pro-{header,master,pivot,sheet,tracking,edit-plus,filter,serverside}). 검증=typecheck+전 워크스페이스 node/vitest+chromium 13/13(affected specs) green·pack-verify leak 0·consumer smoke clean. 런타임 불변(타입+adapter 배선만). type↔value 정합(ADR-007 D2)=수요 게이트 후속 ADR. ★발행 표면 실측=가시 소비자 31 호출부 breaking 0건(PTLPSM=세션 권한 밖, grid-core CHANGELOG 1.0.0 마이그레이션 가이드로 커버).
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
