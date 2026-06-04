---
title: 기능 비교 (vs AG Grid · Wijmo)
sidebar_position: 3
---

# 기능 비교 — topgrid vs 상용 그리드

`@topgrid` 를 **AG Grid (Community + Enterprise)** 와 **Wijmo (FlexGrid + FlexSheet)** 의 기능 카탈로그와
하나하나 대조한 결과다. 상태는 **코드 근거** 기준으로 판정하고(근거 없으면 미구현), 각 항목을 별도
에이전트가 코드베이스를 재확인하는 **adversarial 검증**으로 한 번 더 걸러 over-claim 을 차단했다.

> 19개 카테고리 · **330개 기능** 대조 (2026-06).

## 종합

| 상태 | 수 | 비율 |
|---|---|---|
| ✅ 구현 | 178 | **54%** |
| 🟡 부분 | 60 | 18% |
| ❌ 미구현 | 89 | 27% |
| ➖ 비해당 | 3 | 1% |

`@topgrid` 는 AG Grid **Community** 의 핵심 기능을 대체로 충족하고, **Enterprise 급 차별 기능**도 일부
보유한다 — 피벗, 서버사이드 행 모델(SSRM), 컬럼(가로) 가상화, 통합 차트/스파크라인, 스프레드시트(PoC).
다만 부분·미구현 영역이 남아 **풀 AG Grid Enterprise + Wijmo 패리티에는 아직 미달**이다. headless(TanStack
기반) 특성상 일부 기능은 "소비자가 raw `ColumnDef`·콜백으로 직접 배선"하는 형태로만 가능(=부분)하다.

| 표시 | 의미 |
|---|---|
| ✅ | 코드 근거로 확인된 구현 |
| 🟡 | 부분 — headless passthrough만 / 일부 한계 / 소비자 배선 필요 |
| ❌ | 미구현 |

## 카테고리별 요약

| 카테고리 | 기능 | ✅ | 🟡 | ❌ |
|---|---|---|---|---|
| 정렬 (Sorting) | 18 | 12 | 2 | 4 |
| 필터 (Filtering) | 13 | 8 | 2 | 3 |
| 컬럼 (Columns) | 14 | 7 | 5 | 2 |
| 행 그룹 · 집계 | 19 | 11 | 5 | 3 |
| 피벗 (Pivoting) | 23 | 11 | 2 | 10 |
| 선택 (Selection) | 17 | 11 | 2 | 4 |
| 편집 (Editing) | 18 | 12 | 4 | 2 |
| 셀 렌더링 · 스타일 | 18 | 13 | 3 | 2 |
| 행 모델 · 데이터 | 18 | 11 | 3 | 4 |
| 페이지네이션 | 17 | 8 | 5 | 4 |
| 가상화 · 성능 | 20 | 11 | 4 | 4 |
| Master/Detail · 트리 | 16 | 8 | 5 | 3 |
| 핀/플로팅 행 | 15 | 9 | 2 | 4 |
| Export · 클립보드 · 인쇄 | 15 | 13 | 1 | 1 |
| 통합 차트 · 스파크라인 | 17 | 7 | 2 | 6 |
| 접근성 · 키보드 | 18 | 6 | 4 | 8 |
| 상태 · 테마 · i18n | 17 | 7 | 1 | 9 |
| 스프레드시트 (FlexSheet) | 23 | 11 | 3 | 9 |
| 기타 UX (패널/메뉴/오버레이) | 14 | 2 | 5 | 7 |

## 강점

- **정렬/필터/편집/렌더링/export** — Community 핵심을 거의 충족. Excel/CSV export·클립보드(TSV)·셀
  타입 렌더러(11종)·다중 정렬(우선순위 배지)·셀 범위 선택·드래그 채우기(fill handle)·변경 추적·검증 룰.
- **Enterprise 급 차별 기능**:
  - **피벗** (`grid-pro-pivot`) — 다축 + 소계.
  - **서버사이드 행 모델(SSRM)** (`grid-pro-serverside`) — 블록 lazy 로드 + 무한 스크롤 + lazy 그룹,
    정렬/필터 변경 시 stale 응답 자동 폐기(epoch 불변식).
  - **컬럼(가로) 가상화** — 화면 밖 컬럼 미렌더, 핀 컬럼 상존.
  - **통합 차트/스파크라인** (`grid-pro-chart`).
  - **스프레드시트** (`grid-pro-sheet`, PoC) — A1 수식 + 의존 그래프 재계산 + 순환 검출.
- **MIT 코어 + Pro 분리** — AG Grid(community/enterprise) 구조와 동일. 헤드리스 → TanStack 위에서
  원하는 만큼만 켠다.

## 현재 미지원 / 로드맵 (정직한 갭)

상용 그리드(무료 포함)가 갖춘 것 중 **아직 없는** 대표 항목이다.

**접근성 (가장 큰 갭 — 무료 그리드도 기본 제공)**
- ARIA grid/row/cell 역할(`role=grid/gridcell/columnheader`), 위치 속성(`aria-rowindex/colindex`),
  `aria-sort`, Home/End/PageUp/PageDown 내비, roving tabindex 포커스 관리, 스크린리더 live 알림,
  고대비(forced-colors).

**테마 · 국제화**
- 사전 빌드 테마(quartz/alpine 류), CSS 변수 테마 시스템, 다크 모드, **RTL**, UI 텍스트 현지화(localeText),
  그리드 크롬 아이콘 커스터마이즈. (현재 Tailwind className 기반, 토큰 테마 미제공.)

**필터 고도화**
- 플로팅 필터(헤더 아래 인라인 입력 행), 멀티 필터(컬럼당 AND/OR 다중 조건), 어드밴스드 필터(교차 컬럼
  식 빌더).

**피벗 상호작용**
- 피벗 패널(드래그로 차원 구성), 런타임 피벗 설정 변경, 축 전치, 피벗 그룹 펼침/접기, 피벗 결과 정렬/필터.

**스프레드시트 심화 (vs Wijmo FlexSheet)**
- 셀 서식(통화/날짜/소수/조건부), 폰트·배경·테두리·정렬·셀 병합, 멀티 시트/탭, 상대/절대 참조 조정.
  (현재 PoC: A1 참조·`SUM/AVERAGE/...`·의존 재계산까지.)

**기타 UX**
- 행 드래그 재정렬·그리드 간 드래그, 컬럼 헤더 메뉴(정렬/필터/핀 드롭다운), 셀 툴팁, 셀 변경 플래시,
  사이드바/툴 패널 고도화. (상태바·툴 패널·컨텍스트 메뉴는 일부 존재.)

> 전체 330개 항목의 상세 대조 매트릭스(항목별 AG Grid 티어·Wijmo·근거 코드)는 내부 문서
> `docs/internal/COMMERCIAL-GAP-ANALYSIS.md` 에 있다.

## 직접 확인

- <a href="/storybook/" target="_blank" rel="noopener">Storybook 데모</a> — 전 패키지 인터랙티브 컴포넌트
- [예제](/migration/live-demos) — 복사-붙여넣기 코드 패턴
- [아키텍처](/architecture) — 20개 패키지 구성
