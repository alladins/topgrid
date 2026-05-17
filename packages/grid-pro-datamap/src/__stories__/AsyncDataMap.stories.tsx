/**
 * AsyncDataMap.stories.tsx — G-004 AC-008
 *
 * Storybook 인프라(@storybook/react-vite)는 MOD-GRID-99-B에서 도입 예정.
 * 본 파일은 CSF3 컨벤션 (default export meta + named Story exports)만 유지하여
 * 인프라 도입 시 무수정 가용. 타입 import 없음 — tsc strict 통과 보장.
 *
 * C-3: mock 데이터는 Storybook/test 한정 허용 (프로덕션 코드 외)
 * C-4: no any — 명시적 타입 선언 유지
 * C-5: Tailwind className만 (inline style 없음)
 *
 * 시나리오 1: createAsyncDataMap 로딩/캐시 동작
 *   - idle → load() 트리거 → animate-spin 스피너 → loaded (1초 지연)
 *   - staleTime=5000: 5초 내 재편집 → 캐시 hit (loader 미호출)
 *   - 5초 경과 → stale → 재로드
 *
 * 시나리오 2: 정적 DataMap + AsyncDataMap 혼합 통합
 *   - status 컬럼: 정적 createDataMap → 즉시 드롭다운
 *   - country 컬럼: 동적 createAsyncDataMap → 800ms 스피너 → 캐시
 *   - invalidate() 후 country 재편집 → 재로드
 *   - Pro 라이선스 stub 확인 (index.ts L7-11 verifyOrWarn)
 */

const meta = {
  title: 'grid-pro-datamap/AsyncDataMap',
} as const;

export default meta;

/**
 * Story 1: AsyncDataMap 로딩/캐시 시나리오
 * AC-008 시나리오 1: createAsyncDataMap({ loader, valuePath, displayPath, staleTime })
 * 로딩 상태 + staleTime 캐시 동작 검증
 */
export const AsyncDataMapLoading = {
  args: {
    scenario: 'async-datamap-loading',
    description:
      'createAsyncDataMap({ loader: fetchStatusList, valuePath: "code", displayPath: "label", staleTime: 5000 })',
    initialState: 'idle',
    loaderDelayMs: 1000, // 로딩 1초 지연 시뮬레이션
    staleTime: 5000, // 5초 캐시
    dataMapItems: [
      { code: 'ACTIVE', label: '활성' },
      { code: 'INACTIVE', label: '비활성' },
      { code: 'PENDING', label: '대기' },
    ],
    expectedBehavior: [
      '최초 getItems() → state idle → load() 트리거 → animate-spin 스피너',
      '1초 후 loader resolve → state loaded → 드롭다운 3개 항목',
      '5초 내 재편집 → 캐시 hit → 즉시 드롭다운 표시 (loader 미호출)',
      '5초 경과 후 재편집 → stale → 재로드',
    ],
    spec: 'MOD-GRID-12/G-004 AC-001~AC-003 + AC-008',
  },
} as const;

/**
 * Story 2: 정적 + 동적 DataMap 혼합 통합 시나리오
 * AC-008 시나리오 2: createDataMap(정적) + createAsyncDataMap(동적) 혼합 column.dataMap
 * DataMapEditor duck typing 분기 + spinner 연동 검증
 */
export const MixedDataMapIntegration = {
  args: {
    scenario: 'mixed-datamap-integration',
    description: '정적 createDataMap + 동적 createAsyncDataMap 혼합 column.dataMap 설정',
    columns: [
      {
        id: 'status',
        header: '상태',
        dataMapType: 'static',
        items: [
          { code: 'A', label: '활성' },
          { code: 'B', label: '비활성' },
        ],
      },
      {
        id: 'country',
        header: '국가',
        dataMapType: 'async',
        loaderDelayMs: 800,
        items: [
          { code: 'KR', label: '대한민국' },
          { code: 'US', label: '미국' },
        ],
      },
    ],
    expectedBehavior: [
      'status 컬럼: 정적 DataMap → 즉시 드롭다운',
      'country 컬럼: AsyncDataMap → 최초 로딩 spinner 800ms → 이후 캐시',
      'invalidate() 후 country 재편집 → 재로드',
      'Pro 라이선스 stub: verifyOrWarn 호출 확인 (index.ts L7-11)',
    ],
    spec: 'MOD-GRID-12/G-004 AC-004 + AC-008 전체 통합',
  },
} as const;
