---
title: topgrid 소개
sidebar_label: 소개
sidebar_position: 0
---

# topgrid

**TanStack Table 기반의 headless React 그리드 솔루션.** 표시·편집 셀 렌더러,
필터·정렬·페이지네이션·가상화 같은 코어 기능부터 피벗·서버사이드 행 모델(SSRM)·통합 차트·
스프레드시트·고급 필터·범위 선택·집계·셀 병합 같은 Enterprise 급 Pro 기능까지 모듈식
패키지로 제공합니다.

- npm scope: `@topgrid` · **27 패키지** (무료 MIT 7 + 상용 EULA 20)
- 라이선스: MIT 코어/어댑터 + 상용 Pro 패키지

## 시작하기

- [빠른 시작](./getting-started) — 설치와 기본 사용
- [아키텍처](./architecture) — 27개 패키지 구성과 설계
- [기능 비교](./comparison) — AG Grid / Wijmo 대비 기능 매트릭스
- [마이그레이션 가이드](./migration/dataTable-migration) — 레거시 그리드/DataTable에서 `<Grid>`로 전환

## 패키지

| 구분 | 패키지 |
|---|---|
| 무료(MIT) — 7 | `@topgrid/grid-core`, `@topgrid/grid-core-headless`, `@topgrid/grid-renderers`, `@topgrid/grid-features`, `@topgrid/grid-sizing`, `@topgrid/grid-export`, `@topgrid/grid-vue` |
| 상용 — 파사드·라이선스 (3) | `@topgrid/grid`(파사드), `@topgrid/grid-license`, `@topgrid/grid-license-core` |
| 상용 — Pro 기능 (13) | `@topgrid/grid-pro-{agg, pivot, serverside, master, merging, header, datamap, tracking, range, edit-plus, filter, panel, sheet}` |
| 상용 — 차트 (4) | `@topgrid/grid-chart-core`, `@topgrid/grid-pro-chart`, `@topgrid/grid-pro-chart-enterprise`, `@topgrid/grid-pro-chart-enterprise-vue` |

문의: [sales@platree.com](mailto:sales@platree.com)
