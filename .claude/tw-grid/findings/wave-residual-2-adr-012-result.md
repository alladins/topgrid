# ADR-012 P-1 Implementation Result — Wave 5 Residual 2

**Date**: 2026-05-17  
**Implementer**: claude-sonnet-4-6  
**Spec source**: `.claude/tw-grid/findings/wave5-adr-012-spec.md`

---

## Summary

DataTable 컴포넌트(7파일 + index.ts = 8파일)를 완전히 제거하고 유일한 사용처인
`MyNotificationPage.tsx`를 `@tomis/grid-core` `<Grid>` 로 재작성 완료.

---

## Phase Results

| Phase | Action | Result |
|-------|--------|--------|
| 1 | N=1 재확인 (`MyNotificationPage.tsx:16`) | PASS — 변동 없음 |
| 2 | `MyNotificationPage.tsx` 재작성 (`<Grid>` 전환) | DONE |
| 2b | typecheck (재작성 후) | PASS — 신규 에러 0건 (기존 7건 유지) |
| 3 | `from .*DataTable` grep | PASS — 0 hits (src/ 전체) |
| 4 | `components/DataTable/` 삭제 (8파일) | DONE |
| 5 | typecheck (삭제 후) | PASS — 7건 유지 (pre-existing만) |

**Baseline errors (pre-existing)**: 7건 — `PayReal01EditModal.tsx` 구문 오류. 이번 작업과 무관.

---

## Contract Conversions Applied

### 1. ColumnDef 변환
`ColumnInfo[]` (DataTable 전용 타입) → `ColumnDef<NotificationData>[]` (TanStack v8 표준).

- `notificationId` 컬럼 제거: `row.original.notificationId`로 직접 접근으로 대체
- `type: 'checkbox'` → `rowSelection={{ mode: 'multi' }}` (Grid 내장 체크박스)
- `visibility: false` 패턴 → 컬럼 자체 제외 (notificationId만 해당)
- `etc: 'primary'` 패턴 폐기: row actions 전용 trailing 컬럼(`id: 'actions'`)으로 대체

### 2. Row Selection 계약 변경
| 항목 | Old (DataTable) | New (Grid) |
|------|----------------|------------|
| 콜백 시그니처 | `(selectedIds: string)` — TanStack row index 목록 | `(rows: NotificationData[])` — row.original 배열 |
| 저장 형식 | `dataList[parseInt(id)]` 인덱스 기반 | `row.notificationId` 기반 |
| 하위 영향 | `readNotifications`/`deleteListData` 파싱 변경 | notificationId join/split 단순화 |

### 3. 서버사이드 페이지네이션 변환
`pageingInfo (PagingInfo) + listAction('changePageNo'/'changePageSize', ...)` →
`pagination={{ manual: true, totalCount, pageCount, pageIndex: pageNo-1, pageSize, onPaginationChange }}`

- pageNo ↔ pageIndex 변환: `pageIndex = pageNo - 1` (inbound), `pageNo = pageIndex + 1` (outbound)
- `onPaginationChange` 내부에서 pageSize 변경 시 pageNo=1 리셋 유지

### 4. Row Actions (D-3 inline JSX)
`DropdownMenu` (DataTable 내장) → trailing 컬럼 inline JSX 3버튼:
- 조회 (`FaEnvelopeOpen`): `openEditFormCallback({ notificationId: row.original.notificationId })`
- 읽음 처리 (`FaBookReader`): `readNotificationsCallback(...)` 직접 호출
- 삭제 처리 (`FaTrash`): `deleteNotificationsCallback(...)` 직접 호출

### 5. handleListAction 슬림화
제거된 case: `changePageSize`, `changePageNo`, `changeOrderItem`, `readData`, `readNotification`, `deleteNotification`
(페이지네이션은 onPaginationChange로, row actions는 inline JSX로 직접 처리)

잔존 case: `searchDataList`, `downloadListData`, `readNotifications`, `deleteListData`, `sendNotification`

---

## Known Regression (플래그)

**컬럼 헤더 정렬 UI 제거** (`enableSort={false}`)

- AS-IS: DataTable `DataTableColumnHeader` 가 `listAction('changeOrderItem', 'field:dir')` 를 통해 서버 재조회를 트리거
- AS-IS `<Grid>` 에는 서버사이드 `onSortingChange` 콜백이 없음 (types.ts 확인)
- 결정: `enableSort={false}` (기본값 유지) — 클라이언트 정렬 가짜 흉내 거부
- 영향: 초기 로드 및 검색 시 `orderItem: 'send_datetime' desc` 기본 정렬은 유지됨
- 추후 해결: Grid v2에서 `onSortingChange` 서버콜백 추가 시 복원 가능

---

## Deleted Files (8)

```
tw-framework-front/src/components/DataTable/
├── data-table.tsx           (762 lines — 메인 컴포넌트)
├── data-table-types.ts      (57 lines — ButtonInfo, RowActionInfo 타입)
├── data-table-checkbox.tsx
├── data-table-column-header.tsx
├── data-table-pagination.tsx (131 lines)
├── data-table-row-actions.tsx (167 lines)
├── data-table-view-options.tsx
└── index.ts                 (9 lines — barrel export)
```

---

## Modified Files (1)

- `tw-framework-front/src/pages/MyNotification/MyNotificationPage.tsx`
  - Before: 486 lines, imports `DataTable` from `../../components/DataTable`
  - After: ~390 lines, imports `Grid` from `@tomis/grid-core`

---

## Visual Verification Guide (사용자 의무)

페이지 라우트: `/my-notification` (또는 메뉴에서 "내 알림" 접근)

체크리스트:
1. [ ] 그리드 헤더 (전송일시 / 발송자 / 수신자 / 알람 타입 / 제목 / 내용 / 링크 / 수신 일시 / 읽음 일시 / 액션)
2. [ ] 체크박스 컬럼 자동 prepend (좌측 첫 컬럼)
3. [ ] 페이지네이션 컨트롤 (pageSize 드롭다운 + prev/next + 페이지 번호)
4. [ ] 로딩 스켈레톤 표시 (검색 시)
5. [ ] 빈 결과 시 "데이터가 없습니다." 메시지
6. [ ] row actions: 조회/읽음처리/삭제처리 버튼 표시
7. [ ] 툴바: 다운로드 / 선택 삭제 / 검색 / 알림 전송 / 리스트 읽음 버튼
8. [ ] 체크박스 다중 선택 후 "리스트 읽음" / "선택 삭제" 동작
9. [ ] 사이드 패널 (조회 버튼 클릭 시 오픈)
