// packages/grid-pro-datamap/src/types.ts
// C-4: no any, C-29: exactOptionalPropertyTypes=true
import type { CellContext, ColumnDef } from '@tanstack/react-table';

/**
 * DataMap<TItem>: 코드 값 ↔ 레이블 양방향 조회 인터페이스.
 * createDataMap() 팩토리 함수가 반환하는 단일 타입.
 *
 * @typeParam TItem - 옵션 항목 원본 타입 (e.g., { code: string; label: string })
 */
export interface DataMap<TItem = unknown> {
  /** 코드 값 → 표시 레이블. 매핑 없으면 undefined (fallback은 호출자 책임) */
  getDisplay(value: unknown): string | undefined;
  /** 전체 항목 배열 반환 (편집 드롭다운 목록 생성용) */
  getItems(): TItem[];
  /** 레이블 → 코드 값. 매핑 없으면 undefined */
  getValue(display: string): unknown;
}

/** valuePath / displayPath: keyof TItem 또는 accessor 함수 */
export type PathOrAccessor<TItem, TReturn> =
  | keyof TItem
  | ((item: TItem) => TReturn);

export interface CreateDataMapOptions<TItem> {
  items: TItem[];
  valuePath: PathOrAccessor<TItem, unknown>;
  displayPath: PathOrAccessor<TItem, string>;
}

/**
 * DataMapColumnDef<TData>: TanStack ColumnDef + dataMap/selectOptions 확장. Primary export.
 * G-001: dataMap + selectOptions 타입 필드만 정의.
 * G-002/G-003: 실제 렌더러·에디터 연결.
 *
 * C-4: no any (DataMap<unknown>으로 상한 타입 사용)
 * C-29: exactOptionalPropertyTypes=true — optional 필드는 undefined 명시 필요
 *
 * Note: intersection 패턴 채택 (ADR-002, spec Section 3.3, spec ADR-002).
 * D4 prose의 Omit<...>+'meta?: TopgridColumnMeta' 안은 TopgridColumnMeta 정의 누락으로 실현 불가 —
 * C-30: spec code template + ADR-002가 권위. spec feedback L1 참조.
 *
 * Renamed from TopgridColumnDef (ADR-MOD-GRID-REFACTOR-2026-05-17-006, POL-COMPAT §3).
 * See TopgridColumnDef deprecation alias below.
 */
export type DataMapColumnDef<TData> = ColumnDef<TData, unknown> & {
  /**
   * 정적 DataMap 또는 행 단위 동적 DataMap 팩토리.
   * G-001: 타입 정의. G-002: DataMapCell 렌더러에서 소비.
   */
  dataMap?: DataMap<unknown> | ((row: TData) => DataMap<unknown>);
  /**
   * 마이그레이션 alias: EditableGrid의 selectOptions 패턴을 column-level로 이관.
   * - 신규 형식: string[] (code 값 목록) — 기존 meta.selectOptions {value,label}[] 와 다름.
   * - G-001: 타입 선언만. G-002/G-003: createDataMap 내부 변환 구현.
   * @deprecated F-12-06: 1 minor 유지 후 column.dataMap 으로 완전 이전 (C-6, C-23)
   */
  selectOptions?: string[];
};

/**
 * @deprecated Use `DataMapColumnDef` instead.
 * Retained as deprecation alias for one minor cycle (ADR-MOD-GRID-REFACTOR-2026-05-17-006, POL-COMPAT §3).
 * Will be removed in the next major version.
 */
export type TopgridColumnDef<TData> = DataMapColumnDef<TData>;

/**
 * DataMapCellProps<TData>: DataMapCell 컴포넌트의 파라미터 타입 alias.
 * G-002: TanStack CellContext<TData, unknown> = DataMapCell의 단일 입력 타입.
 * 사용처에서 `DataMapCellProps<MyRow>` 로 단축 참조 가능.
 */
export type DataMapCellProps<TData> = CellContext<TData, unknown>;

/**
 * DataMapEditorProps<TItem>: 편집 셀 드롭다운 에디터 컴포넌트 파라미터 타입.
 * G-003: 필터-타이핑 드롭다운 (DataMapEditor).
 *
 * C-4: no any — C-29: exactOptionalPropertyTypes=true 호환
 *
 * @typeParam TItem - DataMap 항목 원본 타입 (e.g., { code: string; label: string })
 */
export interface DataMapEditorProps<TItem> {
  /** 현재 셀의 코드 값 (DataMap.getValue 기준) */
  value: unknown;
  /** 선택 목록 제공자 — getItems()로 전체 항목 반환 */
  dataMap: DataMap<TItem>;
  /** 선택 확정 콜백 — newValue는 DataMap의 코드 값 */
  onCommit: (newValue: unknown) => void;
  /** 편집 취소 콜백 */
  onCancel: () => void;
  /**
   * Optional: TItem → 표시 레이블 변환 함수.
   * DataMap 내부 Map이 valuePath(item) 코드 키로 저장되므로
   * getDisplay(item) 직접 호출 불가 (F-06 spec code defect 수정).
   * 미제공 시 String(item) fallback (spec Section 11.3 explicit alternative).
   *
   * C-29: optional — 미제공 시 undefined (spread-skip 불필요, 내부 소비용)
   */
  getLabelFromItem?: (item: TItem) => string;
}

/**
 * AsyncDataMapState: AsyncDataMap 내부 로딩 상태 머신.
 * 'idle': 초기 상태 (load 미호출)
 * 'loading': loader() Promise 실행 중
 * 'loaded': items 로드 완료 + 캐시 유효
 * 'error': loader() reject — fallback 빈 목록 반환 (EC-002)
 *
 * C-4: no any — string literal union
 */
export type AsyncDataMapState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * AsyncDataMap<TItem>: 비동기 DataMap 인터페이스.
 * DataMap<TItem>을 확장 — DataMapEditor/DataMapCell에 동기 DataMap과 동일하게 사용 가능.
 *
 * 추가 멤버:
 * - state: 현재 로딩 상태 (readonly)
 * - load(): 비동기 로드 트리거 — Promise<void> (이미 loading 중이면 동일 Promise 공유)
 * - invalidate(): 캐시 무효화 → state 'idle' 리셋 → 다음 getItems() 시 재로드
 * - onStateChange?: state 변경 콜백 등록 (DataMapEditor spinner 연동용)
 *   반환값 = unsubscribe 함수 (DataMapEditor useEffect cleanup 호출)
 *
 * C-4: no any — TItem 상한 유지
 * C-29: onStateChange? optional — 미제공 시 undefined 체크 필수
 */
export interface AsyncDataMap<TItem = unknown> extends DataMap<TItem> {
  readonly state: AsyncDataMapState;
  load(): Promise<void>;
  invalidate(): void;
  onStateChange?(callback: (state: AsyncDataMapState) => void): () => void;
}

/**
 * CreateAsyncDataMapOptions<TItem>: createAsyncDataMap 팩토리 옵션.
 *
 * C-4: no any
 * C-29: staleTime? optional — 미제공 시 내부 DEFAULT_STALE_TIME(300_000 ms) 사용.
 *       내부 소비: `options.staleTime !== undefined ? options.staleTime : DEFAULT_STALE_TIME`
 */
export interface CreateAsyncDataMapOptions<TItem> {
  /** 옵션 항목 비동기 로더 — Promise<TItem[]> 반환 */
  loader: () => Promise<TItem[]>;
  /** 코드 값 경로 또는 accessor */
  valuePath: PathOrAccessor<TItem, unknown>;
  /** 표시 레이블 경로 또는 accessor */
  displayPath: PathOrAccessor<TItem, string>;
  /**
   * 캐시 유효 기간 (ms). 미제공 시 5분(300_000 ms).
   * C-29: optional — staleTime !== undefined 체크 후 내부 사용
   */
  staleTime?: number;
}

