// packages/grid-pro-datamap/src/internal/asyncCache.ts
// G-004: 단일 AsyncDataMap 인스턴스용 캐시 관리자.
// C-4: no any — TItem 제네릭
// C-31: buildAsyncCache() → createAsyncDataMap.ts 에서 import + 실제 호출 (Wiring Audit)
// No React deps — 순수 TypeScript 클로저 구현

/**
 * CacheEntry<TItem>: 캐시 슬롯 구조체.
 * loadedAt = Date.now() 기준 ms timestamp (staleTime 만료 계산 기준)
 *
 * C-4: no any
 */
export interface CacheEntry<TItem> {
  items: TItem[];
  loadedAt: number;
}

/**
 * AsyncCache<TItem>: 단일 AsyncDataMap 인스턴스용 캐시 관리자.
 *
 * - get(staleTime): staleTime ms 이내이면 items 반환, stale 또는 미존재 시 null
 * - set(items): 캐시 저장 (loadedAt = Date.now())
 * - invalidate(): 캐시 초기화 (entry 제거)
 *
 * 캐시 키: '__default__' 고정 (단일 loader 기반 AsyncDataMap 인스턴스당 1 슬롯)
 *
 * C-4: no any — TItem 제네릭
 */
export interface AsyncCache<TItem> {
  get(staleTime: number): TItem[] | null;
  set(items: TItem[]): void;
  invalidate(): void;
}

/**
 * buildAsyncCache<TItem>(): AsyncCache<TItem> 인스턴스 생성.
 *
 * C-31: createAsyncDataMap.ts 가 이 함수를 import + load() 내 실제 호출 (Wiring Audit 대상)
 *
 * 내부 구현: Map<'__default__', CacheEntry<TItem>> + 클로저
 * React 의존성 없음 — 순수 TypeScript
 *
 * @returns AsyncCache<TItem>
 */
export function buildAsyncCache<TItem>(): AsyncCache<TItem> {
  const store = new Map<'__default__', CacheEntry<TItem>>();

  return {
    get(staleTime: number): TItem[] | null {
      const entry = store.get('__default__');
      if (entry === undefined) {
        return null;
      }
      const age = Date.now() - entry.loadedAt;
      if (age > staleTime) {
        return null;
      }
      return entry.items;
    },

    set(items: TItem[]): void {
      store.set('__default__', { items, loadedAt: Date.now() });
    },

    invalidate(): void {
      store.delete('__default__');
    },
  };
}
