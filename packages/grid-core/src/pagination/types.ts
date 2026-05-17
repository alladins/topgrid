/**
 * Pagination 동작 모드.
 *
 * - `'client'`: 전체 데이터 로드 후 클라이언트 슬라이싱. `manualPagination: false`.
 * - `'server'`: 서버에서 페이지 단위 로드. `manualPagination: true`. `totalCount` 또는 `pageCount` 필수.
 * - `'none'`: pagination 비활성화 (기본값 — `enablePagination: false`).
 *
 * @since G-001 (MOD-GRID-03)
 */
export type PaginationMode = 'client' | 'server' | 'none';
