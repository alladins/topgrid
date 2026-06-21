---
title: 기능 비교 (vs AG Grid · Wijmo)
sidebar_position: 3
---

# 기능 비교 — topgrid vs 상용 그리드

`@topgrid` 를 **AG Grid (Community + Enterprise)** 와 **Wijmo (FlexGrid + FlexSheet)** 의 기능 카탈로그와
하나하나 대조한 결과다. 상태는 **코드 근거** 기준으로 판정하고(근거 없으면 미구현), 각 항목을 별도
에이전트가 코드베이스를 재확인하는 **adversarial 검증**으로 한 번 더 걸러 over-claim 을 차단했다.

> 19개 카테고리 · **330개 기능** 대조 (2026-06, canonical).

## 종합

| 상태 | 수 | 비율 |
|---|---|---|
| ✅ 구현 | 248 | **75%** |
| 🟡 부분 | 73 | 22% |
| ❌ 미구현 | 6 | 2% |
| ➖ 비해당 | 3 | 1% |

`@topgrid` 는 AG Grid **Community** 핵심을 충족하고, **Enterprise 급 차별 기능**도 폭넓게 보유한다 —
피벗, 서버사이드 행 모델(SSRM), 컬럼(가로) 가상화, 통합 차트/스파크라인, 마스터-디테일, 고급 필터,
스프레드시트(수식 엔진). 미구현(❌)은 6개로 좁혀졌고 모두 **설계상 의도적 연기**다(아래 로드맵).
부분(🟡 22%)은 대부분 headless 특성상 "소비자가 raw `ColumnDef`·콜백으로 직접 배선"하거나 PoC 단계인
항목이다 — 동작은 하되 turnkey 가 아니다.

| 표시 | 의미 |
|---|---|
| ✅ | 코드 근거로 확인된 구현 |
| 🟡 | 부분 — headless passthrough만 / 일부 한계 / 소비자 배선 필요 / PoC |
| ❌ | 미구현 (의도적 연기) |
| ➖ | headless 그리드에 비해당 |

## 카테고리별 요약

| 카테고리 | 기능 | ✅ | 🟡 | ❌ | ➖ |
|---|---|---|---|---|---|
| 정렬 (Sorting) | 18 | 15 | 2 | 1 | 0 |
| 필터 (Filtering) | 13 | 12 | 1 | 0 | 0 |
| 컬럼 (Columns) | 14 | 9 | 5 | 0 | 0 |
| 행 그룹 · 집계 | 19 | 12 | 7 | 0 | 0 |
| 피벗 (Pivoting) | 23 | 21 | 2 | 0 | 0 |
| 선택 (Selection) | 17 | 15 | 2 | 0 | 0 |
| 편집 (Editing) | 18 | 14 | 4 | 0 | 0 |
| 셀 렌더링 · 스타일 | 18 | 15 | 3 | 0 | 0 |
| 행 모델 · 데이터 | 18 | 15 | 3 | 0 | 0 |
| 페이지네이션 | 17 | 12 | 5 | 0 | 0 |
| 가상화 · 성능 | 20 | 12 | 4 | 3 | 1 |
| Master/Detail · 트리 | 16 | 10 | 6 | 0 | 0 |
| 핀/플로팅 행 | 15 | 12 | 3 | 0 | 0 |
| Export · 클립보드 · 인쇄 | 15 | 13 | 1 | 1 | 0 |
| 통합 차트 · 스파크라인 | 17 | 11 | 4 | 0 | 2 |
| 접근성 · 키보드 | 18 | 12 | 6 | 0 | 0 |
| 상태 · 테마 · i18n | 17 | 12 | 4 | 1 | 0 |
| 스프레드시트 (FlexSheet) | 23 | 16 | 7 | 0 | 0 |
| 기타 UX (패널/메뉴/오버레이) | 14 | 10 | 4 | 0 | 0 |
| **합계** | **330** | **248** | **73** | **6** | **3** |

## 강점

- **정렬·필터·편집·렌더링·export** — Community 핵심을 충족. Excel/CSV/PDF export·클립보드(TSV)·인쇄·셀
  타입 렌더러(11종)·다중 정렬(우선순위 배지)·로케일/null 배치·셀 범위 선택·드래그 채우기(fill handle).
- **Enterprise 급 차별 기능**:
  - **피벗** (`grid-pro-pivot`, ✅21/23) — 다축 + 소계 + 축 전치 + 펼침/접기 + 피벗 패널(DnD) + 서버사이드 피벗.
  - **서버사이드 행 모델(SSRM)** (`grid-pro-serverside`) — 블록 lazy 로드 + 무한 스크롤 + 뷰포트 모델 +
    서버 트리, 정렬/필터 변경 시 stale 응답 자동 폐기(epoch 불변식).
  - **컬럼(가로) 가상화** — 화면 밖 컬럼 미렌더, 핀 컬럼 상존(행+컬럼 동시 가상화).
  - **통합 차트/스파크라인** (`grid-pro-chart`) — zero-dep SVG 엔진, 차트→그리드 크로스 필터.
  - **마스터-디테일 + 가상화** (`grid-pro-master`), 멀티-행 헤더, 셀 병합.
  - **고급 필터** (`grid-pro-filter`) — 멀티(AND/OR) + 어드밴스드(교차 컬럼 식) + 크로스 필터.
  - **편집 심화** (`grid-pro-edit-plus`) — full-row 편집 + 커스텀 에디터 슬롯 + undo/redo + 검증 룰 +
    find & replace + 셀 코멘트.
  - **스프레드시트** (`grid-pro-sheet`, PoC) — A1/절대참조 + 멀티시트 + 명명 범위 + VLOOKUP/날짜/재무 함수 +
    의존 그래프 재계산 + 순환 검출 + 셀 서식/스타일/병합.
- **접근성** — ARIA grid 의미론(default-on, 가상화 하 절대 인덱스) + 키보드 내비(aria-activedescendant) +
  스크린리더 live 알림. axe-core 검증.
- **MIT 코어 + Pro 분리** — AG Grid(community/enterprise) 구조와 동일. headless(TanStack 기반) → 원하는 만큼만 켠다.

## 로드맵 (정직한 갭 — ❌6)

상용 그리드가 갖춘 것 중 **아직 없는** 항목은 6개이며, 모두 **설계상 의도적 연기**다.

- **RTL(right-to-left) 레이아웃** — 핀 컬럼 오프셋 등이 LTR 전제라 invasive. (상태·테마·i18n)
- **Post-sort 콜백** — 정렬 후 행 재배치 훅. 정렬 hot-path 수술 필요. (정렬)
- **디바운스 스크롤 노브 · 행 애니메이션 · 자동 가상화 임계값** — 의도적 미적용(가상화는 명시적 opt-in). (가상화·성능)
- **Excel 셀 스타일 export**(폰트/배경/테두리) — community `xlsx` 가 스타일(.s)을 strip. (Export)

> **부분(🟡 73)** 은 동작하되 turnkey 가 아닌 항목이다 — headless 라 소비자가 raw `ColumnDef`·콜백으로
> 배선하거나(예: faceted 필터 값, 커스텀 comparator), 일부 한계가 있거나(예: 셀 병합·스프레드시트 PoC),
> 렌더 후속이 남은(예: 일부 그룹 footer 렌더) 경우다. 정직하게 ✅ 와 구분한다.

> 전체 330개 항목의 상세 대조 매트릭스(항목별 AG Grid 티어·Wijmo·근거 코드)는 내부 문서
> `docs/internal/COMMERCIAL-GAP-ANALYSIS.md` 가 SSoT 다.

## 직접 확인

- <a href="/storybook/" target="_blank" rel="noopener">Storybook 데모</a> — 전 패키지 인터랙티브 컴포넌트
- [예제](/migration/live-demos) — 복사-붙여넣기 코드 패턴
- [아키텍처](/architecture) — 27개 패키지 구성
