// packages/grid-pro-datamap/src/createAsyncDataMap.ts
// G-004: AsyncDataMap 팩토리.
// C-4: no any — TItem 제네릭
// C-29: staleTime? optional — !== undefined 체크 후 내부 사용 (exactOptionalPropertyTypes)
// C-31: buildAsyncCache import + load() 내 실제 호출 (Wiring Audit — A-06)
// C-16: @mescius/xxxx* import 없음
// D-7: 패키지 entrypoint(index.ts) 아님 → 별도 verifyOrWarn 불필요
// EC-001: pendingPromise de-dupe (concurrent load() 방지)
// EC-002: loader reject → state 'error', getItems() → []
// EC-003: staleTime 경과 시 getItems() → load() 재트리거 + stale items 유지 (UX 연속성)
// EC-004: invalidate() 후 getItems() → load() 자동 트리거 + [] 반환 (loading 중)
// EC-005: staleTime: undefined 명시 전달 시 DEFAULT_STALE_TIME 적용

import type { AsyncDataMap, AsyncDataMapState, CreateAsyncDataMapOptions } from './types';
import { buildAsyncCache } from './internal/asyncCache';
import { buildDataMap } from './DataMap';

/**
 * DEFAULT_STALE_TIME: 5분 (ms).
 * C-29: CreateAsyncDataMapOptions.staleTime? 미제공 시 적용.
 */
const DEFAULT_STALE_TIME = 300_000;

/**
 * createAsyncDataMap<TItem>: AsyncDataMap 팩토리.
 *
 * - DataMap<TItem> 완전 구현: getDisplay, getItems, getValue (AC-001)
 * - 4-state 상태머신: idle → loading → loaded/error (AC-002, Section 12)
 * - staleTime 기반 캐싱 + invalidate() (AC-003)
 * - pendingPromise de-dupe: 동시 load() 호출 시 동일 Promise 공유 (EC-001)
 * - onStateChange?: 구독 콜백 등록 → 구독 해제 함수 반환 (Section 3.1)
 *
 * @param options - CreateAsyncDataMapOptions<TItem>
 * @returns AsyncDataMap<TItem>
 */
export function createAsyncDataMap<TItem>(
  options: CreateAsyncDataMapOptions<TItem>,
): AsyncDataMap<TItem> {
  const { loader, valuePath, displayPath } = options;
  // C-29: staleTime optional — undefined 체크 후 DEFAULT 적용
  const effectiveStaleTime =
    options.staleTime !== undefined ? options.staleTime : DEFAULT_STALE_TIME;

  // C-31 Wiring: buildAsyncCache 실제 호출 (asyncCache.ts Wiring Audit)
  const cache = buildAsyncCache<TItem>();

  // 내부 상태
  let state: AsyncDataMapState = 'idle';
  let loadedItems: TItem[] = [];

  // pendingPromise de-dupe (EC-001): 동시 load() 호출 시 동일 Promise 공유
  let pendingPromise: Promise<TItem[]> | null = null;

  // onStateChange 구독자 집합
  const subscribers = new Set<(s: AsyncDataMapState) => void>();

  function setState(next: AsyncDataMapState): void {
    state = next;
    for (const cb of subscribers) {
      cb(next);
    }
  }

  async function load(): Promise<void> {
    // EC-001: 이미 loading 중이면 pendingPromise 공유
    if (state === 'loading' && pendingPromise !== null) {
      await pendingPromise;
      return;
    }
    // EC-003: staleTime 이내 캐시가 유효하면 skip
    const cached = cache.get(effectiveStaleTime);
    if (cached !== null && state === 'loaded') {
      return;
    }
    // state 'error' 또는 'idle' 또는 stale 'loaded' → 재로드
    setState('loading');

    const promise = loader();
    pendingPromise = promise;

    try {
      const items = await promise;
      cache.set(items);
      loadedItems = items;
      setState('loaded');
    } catch {
      // EC-002: loader reject → state 'error', 빈 목록 유지 (error 정보는 state로 전달)
      setState('error');
    } finally {
      pendingPromise = null;
    }
  }

  function invalidate(): void {
    cache.invalidate();
    pendingPromise = null;
    loadedItems = [];
    setState('idle');
  }

  // 레이블 캐시 인덱싱 (G-001 DataMap 패턴 — valueToDisplay / displayToValue Map)
  // AsyncDataMap이 loaded 상태일 때 buildDataMap을 동적으로 생성하여 O(1) 조회 지원
  function buildCurrentDataMap(): ReturnType<typeof buildDataMap<TItem>> {
    return buildDataMap({
      items: loadedItems,
      valuePath,
      displayPath,
    });
  }

  return {
    get state(): AsyncDataMapState {
      return state;
    },

    // DataMap<TItem> 구현: getDisplay
    getDisplay(value: unknown): string | undefined {
      if (loadedItems.length === 0) {
        return undefined;
      }
      return buildCurrentDataMap().getDisplay(value);
    },

    // DataMap<TItem> 구현: getItems
    // EC-003: staleTime 경과 시 load() 자동 트리거 + 이전 items 유지 (UX 연속성)
    // EC-004: idle 상태 시 load() 자동 트리거
    getItems(): TItem[] {
      const cached = cache.get(effectiveStaleTime);
      if (cached === null && state !== 'loading') {
        // idle 또는 stale — 비동기 재로드 트리거 (fire-and-forget)
        void load();
      }
      // stale 중에도 이전 loadedItems 반환 (UX 연속성, EC-003)
      return loadedItems.slice();
    },

    // DataMap<TItem> 구현: getValue
    getValue(display: string): unknown {
      if (loadedItems.length === 0) {
        return undefined;
      }
      return buildCurrentDataMap().getValue(display);
    },

    load,

    invalidate,

    // C-29: onStateChange optional — DataMapEditor에서 useEffect cleanup으로 반환값 호출
    onStateChange(callback: (s: AsyncDataMapState) => void): () => void {
      subscribers.add(callback);
      return (): void => {
        subscribers.delete(callback);
      };
    },
  };
}
