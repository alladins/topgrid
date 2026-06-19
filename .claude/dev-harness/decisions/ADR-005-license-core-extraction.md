---
id: ADR-005
title: 라이선스 코어 framework-neutral 추출 — Vue 자동 워터마크 게이트
module: W2 follow-up #1 (grid-license-core)
date: 2026-06-19
status: accepted
related: [ADR-004, "ROADMAP §3-12", PAT-003, LESS-002]
---

# ADR-005 — grid-license-core 추출: Vue 가 React 없이 라이선스 자동 게이트

## Context
[[ROADMAP-MULTIFRAMEWORK-CHART]] §3-12 의 정직한 한계: Vue 차트 패널은 라이선스 워터마크를 **자동** 게이트하지 못하고 `watermark` prop 주입에 의존했다. 이유 = `@topgrid/grid-license` 가 React 전용(react peerDependency)이라 Vue 가 import 하면 React 가 Vue 트리에 누출(ADR-004 R2 가 거부한 패턴). **extract-on-demand 6번째 발동**(headless 4 + chart-core 1 + license-core): Vue 자동 게이트가 실제 비-React 소비자 요구.

## Decision
grid-license 의 **framework-neutral 부분**(라이선스 state 싱글톤·checkLicense·setLicenseKey·verifySignature·types)을 신규 `@topgrid/grid-license-core`(deps 0, react 0)로 **이동**. grid-license(React)는 거기서 re-export(공개 표면 무변경) + React `Watermark`/`useLicenseStatus`/`useWatermarkEnforcement` 만 보유. Vue 차트는 grid-license-core 의 `checkLicense`/`subscribeLicense` 로 **반응형 자동 게이트**(prop override 유지).

## ★발행 블래스트 반경 = 2 (mass republish 아님)
초기 우려(=grid-license 13 의존자 전부 lockstep)는 **과대평가**였다. **React 패키지와 Vue 패키지는 서로 다른 프레임워크 앱에서 소비**된다(Vue 앱에 grid-pro-master[React] 안 들어감). 라이선스 state 는 모듈 싱글톤이라 split 은 *한 앱에 두 grid-license 인스턴스 공존* 시에만 발생 — 프레임워크가 갈리므로 그 시나리오 없음. 따라서:
- **로컬**: grid-license 가 core 를 re-export = 단일 소스(fork 없음).
- **발행 = 2개만**: `grid-license-core@0.1.0`(신규) + `grid-pro-chart-enterprise-vue@0.3.0`(auto-gate). **grid-license@0.3.0 + React 의존 12 패키지 = 재발행 불요**(npm 의 self-contained 0.3.0 그대로 React 생태계서 동작).

## Rejected
- **(R1) Vue 가 `@topgrid/grid-license`(React) 의존** — react/react-dom peer 를 Vue 소비자에 강제(ADR-004 R2 와 동일 누출). 거부.
- **(R2) Vue 패키지가 라이선스 체크 로직 복제** — fork. 싱글톤이 두 개 = 앱이 setLicenseKey 호출해도 한쪽 미반영. 거부.
- **(R3) grid-license 즉시 재발행 + 13 의존자 lockstep** — 프레임워크 분리로 불필요(위). 비용만 큼. 거부(다음 grid-license 정식 릴리스 때 자연 수렴).

## Trade-offs
1. **신규 중립 패키지 vs Vue 의 React 비결합**: grid-chart-core 와 동형 교환(저장소 6번째 수용). 비용=패키지 1 + grid-license 로컬 재배선. 이득=Vue 자동 게이트 + 단일 싱글톤 소스.
2. **npm 전환 한계(수용)**: grid-license@0.3.0(npm)은 *자체 포함* 싱글톤 유지(core 미사용) → core 와 별개 싱글톤. 단 React/Vue 생태계 분리라 한 앱서 공존 안 함=무해. 완전 수렴은 grid-license 차기 릴리스가 core 의존 선언할 때(lockstep 꼬리, 필요 시점).

## 검증 (전부 green)
- grid-license-core: typecheck0·build. grid-license(재배선): typecheck0·build.
- Vue 차트 auto-gate: happy-dom node **12 passed**(unlicensed→워터마크·valid license→없음·prop override, non-vacuous).
- ★**full chromium 비주얼 130 passed 0 fail**=grid-license 재배선이 **byte-identical**(range-chart PAT-003·multi-filter·enterprise 게이트·License.stories 전부 무회귀). 재배선이 행위 무변경 입증.
- ★git rename(R) 인식=fork 아닌 이동.

## 컴파운딩 데이터포인트 (하네스 학습)
**프레임워크 분리가 lockstep 블래스트를 줄인다.** "공유 패키지 재배선 = 전 의존자 mass republish" 는 *동일 프레임워크* 생태계에서만 참. React/Vue 가 갈리면 싱글톤 공존이 없어 부분 발행이 안전. extract-on-demand + 블래스트 반경을 프레임워크 경계로 재평가하라([[LESS-002]] react-major-split 계열의 역 — 분리가 비용을 낮춤).
