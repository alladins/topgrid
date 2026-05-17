// packages/grid-pro-datamap/src/DataMapEditor.tsx
// G-003: 편집 셀 필터-타이핑 드롭다운 (DataMapEditor).
// C-4: no any — C-5: Tailwind CSS only — C-12: tsc strict — C-16: @mescius/wijmo* import 0건
// C-18: 가상화 호환 (getItems() + filter O(n) — 드롭다운 UI 한정, 가상화 스크롤 불필요)
// C-29: exactOptionalPropertyTypes 호환 (optional prop 내부 소비 — spread-skip 불필요)
// D-7: 패키지 entrypoint(index.ts)가 아니므로 별도 verifyOrWarn 불필요 (ADR-MOD-GRID-00-012)
import { useEffect, useRef, useState } from 'react';
import type { JSX } from 'react';

import type { AsyncDataMap, AsyncDataMapState, DataMapEditorProps } from './types';

/**
 * getLabelOf: TItem → 표시 레이블 (필터용).
 *
 * DataMap 내부 Map은 valuePath(item) 코드 값으로 키 저장 — getDisplay(item) 직접 호출 불가.
 * F-06: spec Section 3.4 filter pattern 버그 수정.
 * spec Section 11.3 explicit alternative: getLabelFromItem prop 제공 시 우선 사용,
 * 미제공 시 String(item) fallback.
 *
 * C-4: no any — TItem 상한 타입 유지
 */
function getLabelOf<TItem>(
  item: TItem,
  getLabelFromItem: ((item: TItem) => string) | undefined,
): string {
  if (getLabelFromItem !== undefined) {
    return getLabelFromItem(item);
  }
  return String(item);
}

/**
 * DataMapEditor<TItem>: 편집 셀 필터-타이핑 드롭다운 컴포넌트.
 *
 * - 마운트 시 input에 자동 포커스 (AC-001)
 * - 타이핑 → items 필터링 (대소문자 무관, IME 조합 중 필터 억제) (AC-002)
 * - 드롭다운: absolute z-50 bg-white border border-gray-200 rounded shadow-md max-h-48 overflow-y-auto (AC-003)
 * - 키보드: ArrowDown/Up 이동, Enter 선택, Escape 취소 (AC-004)
 * - ARIA: role="combobox" + aria-expanded + role="listbox" + role="option" (AC-006)
 * - highlightedIndex: filtered.length 변경 시 -1 리셋 (spec Section 11.2 risk #4)
 * - isComposing: useRef<boolean> 사용 — setState 불필요 (spec Section 11.2 risk #3)
 *
 * C-2: DataMapEditorProps<TItem> 표준 API (spec Section 3.1)
 * C-4: no any — TItem 제네릭 상한
 * C-5: Tailwind CSS only
 * C-18: getItems() + Array.filter — O(n), 가상화 호환
 *
 * @param props - DataMapEditorProps<TItem>
 * @returns 입력 필드 + 조건부 드롭다운 컨테이너
 */
export function DataMapEditor<TItem>(
  props: DataMapEditorProps<TItem>,
): JSX.Element {
  const { value, dataMap, onCommit, onCancel, getLabelFromItem } = props;

  // AC-002: AsyncDataMap duck typing (spec Section 3.4)
  // 'state' in dataMap && 'load' in dataMap → AsyncDataMap
  const isAsync = 'state' in dataMap && 'load' in dataMap;
  const asyncDataMap = isAsync ? (dataMap as AsyncDataMap<TItem>) : null;

  // async 상태 추적 — onStateChange 구독 + state 동기화
  const [asyncState, setAsyncState] = useState<AsyncDataMapState>(
    asyncDataMap !== null ? asyncDataMap.state : 'loaded',
  );

  // AsyncDataMap onStateChange 구독 (AC-002 spinner 연동)
  useEffect(() => {
    if (asyncDataMap === null) return;
    // 구독 등록 (spec Section 3.1: onStateChange optional)
    const unsub = asyncDataMap.onStateChange !== undefined
      ? asyncDataMap.onStateChange((s) => { setAsyncState(s); })
      : undefined;
    return (): void => {
      if (unsub !== undefined) unsub();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 초기 표시값: 현재 value → getDisplay → 없으면 빈 문자열
  const initialDisplay = dataMap.getDisplay(value) ?? '';
  const [query, setQuery] = useState<string>(initialDisplay);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [open, setOpen] = useState<boolean>(true);

  // IME 조합 중 플래그 — useRef: 렌더 불필요 (spec Section 11.2 risk #3)
  const isComposing = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 마운트 시 input 자동 포커스 + 전체 선택 (AC-001)
  useEffect(() => {
    if (inputRef.current !== null) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // 필터링: query 기준 대소문자 무관 부분 일치
  // F-06 fix: getLabelOf 사용 (getDisplay(item) 직접 호출 금지)
  const allItems = dataMap.getItems();
  const filtered: TItem[] = allItems.filter((item) => {
    const label = getLabelOf(item, getLabelFromItem);
    return label.toLowerCase().includes(query.toLowerCase());
  });

  // highlightedIndex 리셋: filtered.length 변경 시 -1 (spec Section 11.2 risk #4)
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filtered.length]);

  /**
   * 항목 선택 확정: DataMap.getValue(label)로 코드 값 조회 후 onCommit 호출.
   * getLabelOf 결과로 label 역조회 → DataMap.getValue(label) = 코드 값.
   */
  function commitItem(item: TItem): void {
    const label = getLabelOf(item, getLabelFromItem);
    const code = dataMap.getValue(label);
    onCommit(code);
    setOpen(false);
  }

  /** 키보드 핸들러 (AC-004) */
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    // IME 조합 중에는 ArrowDown/Up/Enter 무시 (spec Section 11.2 risk #3)
    if (isComposing.current) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        filtered.length === 0 ? -1 : Math.min(prev + 1, filtered.length - 1),
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        filtered.length === 0 ? -1 : Math.max(prev - 1, 0),
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        const selectedItem = filtered[highlightedIndex];
        if (selectedItem !== undefined) {
          commitItem(selectedItem);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }

  /** query 변경 핸들러 */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setQuery(e.target.value);
    if (!open) setOpen(true);
  }

  // listbox id (ARIA aria-controls 연결)
  const listboxId = 'datamap-editor-listbox';

  return (
    <div className="relative w-full">
      {/* AC-002: AsyncDataMap loading 상태 시 animate-spin 스피너 (C-5: Tailwind only) */}
      {asyncState === 'loading' && (
        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
          <svg
            className="animate-spin h-4 w-4 text-blue-500"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="로딩 중"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        </div>
      )}
      {/* AC-001: 자동 포커스 input — role="combobox" (AC-006) */}
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open && filtered.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          highlightedIndex >= 0
            ? `datamap-option-${String(highlightedIndex)}`
            : undefined
        }
        className="w-full border border-blue-400 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-300"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => {
          isComposing.current = true;
        }}
        onCompositionEnd={() => {
          isComposing.current = false;
        }}
        onBlur={() => {
          // 드롭다운 항목 클릭 처리를 위해 약간 지연 후 취소
          // (mousedown → blur 순서: mousedown에서 commitItem 처리 후 blur)
          // onBlur가 발생하면 onCancel — commitItem 경로에서는 setOpen(false) 먼저 수행
          if (open) {
            onCancel();
          }
        }}
        type="text"
      />

      {/* AC-003: 드롭다운 목록 — absolute z-50 bg-white border border-gray-200 rounded shadow-md max-h-48 overflow-y-auto */}
      {open && filtered.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 bg-white border border-gray-200 rounded shadow-md max-h-48 overflow-y-auto w-full mt-0.5"
        >
          {filtered.map((item, idx) => {
            const label = getLabelOf(item, getLabelFromItem);
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={label}
                id={`datamap-option-${String(idx)}`}
                role="option"
                aria-selected={isHighlighted}
                className={
                  isHighlighted
                    ? 'px-3 py-1.5 text-sm cursor-pointer bg-blue-100 text-blue-900'
                    : 'px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100'
                }
                // mousedown 우선: blur 이전에 commitItem 완료 → onBlur에서 open=false이므로 onCancel 미호출
                onMouseDown={(e) => {
                  e.preventDefault(); // blur 방지
                  commitItem(item);
                }}
              >
                {label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
