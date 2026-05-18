/**
 * @topgrid/grid-core — createColumns 단위 테스트
 *
 * MOD-GRID-04 G-001: TC-01~TC-10 (Vitest)
 *
 * @see createColumns
 * @see Section 6 테스트 계획
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createColumns } from './createColumns';
import { defaultRendererRegistry, registerRenderer } from './rendererRegistry';
import type { TomisColumnDef } from './types';
import type { ColumnInfo } from '../legacy/ColumnInfo';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createColumns', () => {
  // TC-01: 빈 배열 → [] 반환, 에러 없음 (EC-01)
  it('TC-01: 빈 배열 입력 시 빈 배열 반환', () => {
    const result = createColumns([]);
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  // TC-02: text type → accessorKey: 'name', header: '이름'
  it('TC-02: text type column — accessorKey + header 매핑', () => {
    const defs: TomisColumnDef<{ name: string }>[] = [
      { id: 'name', name: '이름', type: 'text', align: 'left', width: '100' },
    ];
    const result = createColumns(defs);
    expect(result).toHaveLength(1);
    const col = result[0];
    expect(col.header).toBe('이름');
    // accessorKey는 TanStack ColumnDef의 AccessorKeyColumnDef에 있음
    expect((col as { accessorKey?: string }).accessorKey).toBe('name');
  });

  // TC-03: number type → renderer 적용 (registry에 등록된 fn)
  it('TC-03: number type column — cell 렌더러 함수 할당', () => {
    const defs: TomisColumnDef<{ count: number }>[] = [
      { id: 'count', name: '수량', type: 'number', align: 'right', width: '80' },
    ];
    const result = createColumns(defs);
    const col = result[0];
    // cell 함수가 정의되어야 함 (registry['number'] 존재)
    expect(typeof col.cell).toBe('function');
  });

  // TC-04: checkbox type → accessorKey 없음, enableSorting: false (AC-006, EC-08)
  it('TC-04: checkbox type — DisplayColumnDef, enableSorting: false', () => {
    const defs: TomisColumnDef<Record<string, unknown>>[] = [
      { id: 'sel', name: '', type: 'checkbox', align: 'center', width: '50' },
    ];
    const result = createColumns(defs);
    const col = result[0];
    expect((col as { accessorKey?: string }).accessorKey).toBeUndefined();
    expect(col.enableSorting).toBe(false);
    expect(col.id).toBe('sel');
  });

  // TC-05: dateTime type + width:'200' → size: 200 (EC-03)
  it('TC-05: dateTime type + width 파싱 — size: 200', () => {
    const defs: TomisColumnDef<{ dt: string }>[] = [
      { id: 'dt', name: '일시', type: 'dateTime', align: 'center', width: '200' },
    ];
    const result = createColumns(defs);
    const col = result[0];
    expect(col.size).toBe(200);
    expect(col.minSize).toBe(100); // Math.floor(200 * 0.5)
    expect(col.maxSize).toBe(600); // 200 * 3
  });

  // TC-06: 미등록 type → fallback + console.warn (AC-007, EC-02)
  it('TC-06: 미등록 type — fallback 반환 + console.warn 호출', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // 타입 우회하여 미등록 type 전달
    const defs = [
      { id: 'x', name: 'X', type: 'unknown_type', align: 'left', width: '100' },
    ] as unknown as TomisColumnDef<Record<string, unknown>>[];
    const result = createColumns(defs);
    expect(result).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('unknown_type'),
    );
    // cell 함수 없음 (TanStack 기본 cell 사용)
    expect((result[0] as { cell?: unknown }).cell).toBeUndefined();
  });

  // TC-07: ColumnInfo[] 입력 (legacy) → boolean type narrowing (AC-005, EC-04)
  it('TC-07: ColumnInfo[] 입력 — type narrowing 후 boolean Y/N renderer', () => {
    const legacyDefs: ColumnInfo[] = [
      { id: 'active', type: 'boolean', align: 'center', name: '활성', width: '80' },
    ];
    const result = createColumns(legacyDefs);
    expect(result).toHaveLength(1);
    expect(typeof result[0].cell).toBe('function');
    // accessorKey 존재 (boolean은 DisplayColumnDef 아님)
    expect((result[0] as { accessorKey?: string }).accessorKey).toBe('active');
  });

  // TC-08: visibility: false — meta에 정보 없음, 호출 측이 columnVisibility 관리 (EC-05, OQ-01)
  it('TC-08: visibility: false — ColumnDef 자체에는 반영 안 됨 (OQ-01)', () => {
    const defs: TomisColumnDef<{ name: string }>[] = [
      { id: 'name', name: '이름', type: 'text', align: 'left', width: '100', visibility: false },
    ];
    const result = createColumns(defs);
    // ColumnDef 자체에 visibility 필드 없음 (TanStack 표준)
    // 호출 측이 initialState.columnVisibility로 처리
    expect(result).toHaveLength(1);
    // accessorKey는 여전히 존재
    expect((result[0] as { accessorKey?: string }).accessorKey).toBe('name');
  });

  // TC-09: meta.primary: true via etc:'primary' (EC-09)
  it('TC-09: etc:"primary" → meta.primary: true', () => {
    const legacyDefs: ColumnInfo[] = [
      { id: 'id', type: 'text', align: 'left', name: 'ID', width: '80', etc: 'primary' },
    ];
    const result = createColumns(legacyDefs);
    expect((result[0].meta as { primary?: boolean } | undefined)?.primary).toBe(true);
  });

  // TC-10: 여러 type 혼합 배열 5개 — 각 index별 type 올바른 분기
  it('TC-10: 혼합 type 배열 — 각 column type 올바른 분기', () => {
    const defs: TomisColumnDef<Record<string, unknown>>[] = [
      { id: 'name', name: '이름', type: 'text', align: 'left', width: '100' },
      { id: 'count', name: '수량', type: 'number', align: 'right', width: '80' },
      { id: 'sel', name: '', type: 'checkbox', align: 'center', width: '50' },
      { id: 'dt', name: '일시', type: 'dateTime', align: 'center', width: '160' },
      { id: 'active', name: '활성', type: 'boolean', align: 'center', width: '80' },
    ];
    const result = createColumns(defs);
    expect(result).toHaveLength(5);

    // text — accessorKey 있음, cell 함수 있음
    expect((result[0] as { accessorKey?: string }).accessorKey).toBe('name');
    expect(typeof result[0].cell).toBe('function');

    // number — accessorKey 있음, cell 함수 있음
    expect((result[1] as { accessorKey?: string }).accessorKey).toBe('count');
    expect(typeof result[1].cell).toBe('function');

    // checkbox — accessorKey 없음, enableSorting: false
    expect((result[2] as { accessorKey?: string }).accessorKey).toBeUndefined();
    expect(result[2].enableSorting).toBe(false);

    // dateTime — accessorKey 있음
    expect((result[3] as { accessorKey?: string }).accessorKey).toBe('dt');

    // boolean — accessorKey 있음, cell 함수 있음
    expect((result[4] as { accessorKey?: string }).accessorKey).toBe('active');
    expect(typeof result[4].cell).toBe('function');
  });
});

describe('rendererRegistry', () => {
  // registry 기본 entry 존재 확인
  it('defaultRendererRegistry: 9종 type 모두 등록됨', () => {
    const types = ['checkbox', 'number', 'boolean', 'dateTime', 'date', 'text', 'badge', 'link', 'icon'] as const;
    for (const type of types) {
      expect(defaultRendererRegistry.has(type)).toBe(true);
    }
  });

  // registerRenderer로 교체 가능 확인
  it('registerRenderer: 새 renderer 등록 가능', () => {
    const registry = new Map(defaultRendererRegistry);
    const customFn = () => 'CUSTOM';
    registerRenderer('text', customFn, registry);
    expect(registry.get('text')).toBe(customFn);
  });

  // boolean renderer Y/N 확인
  it('boolean renderer: true→"Y", false→"N"', () => {
    const boolFn = defaultRendererRegistry.get('boolean');
    expect(boolFn).toBeDefined();
    if (boolFn) {
      const trueResult = boolFn({ getValue: () => true } as Parameters<typeof boolFn>[0]);
      expect(trueResult).toBe('Y');
      const falseResult = boolFn({ getValue: () => false } as Parameters<typeof boolFn>[0]);
      expect(falseResult).toBe('N');
    }
  });

  // fallback: registry에 없는 type → undefined
  it('미등록 type → Map.get() === undefined (fallback 경로)', () => {
    const result = defaultRendererRegistry.get('unknown_type' as never);
    expect(result).toBeUndefined();
  });
});
