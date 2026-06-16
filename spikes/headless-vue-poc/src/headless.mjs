// === W1 PoC: 프레임워크 무관(headless) 공유 레이어 ===
// 핵심 논지: 데이터/행위(정렬·필터·row model)는 한 곳에서 공유되고,
// 프레임워크별로 다른 건 '렌더 함수(cell/header)' 뿐이다.
// 아래 columnData 에는 render 가 없다 — 그게 headless 의 증거.
import {
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/table-core';

export const data = [
  { region: '서울', sales: 320, units: 12 },
  { region: '부산', sales: 510, units: 8 },
  { region: '대구', sales: 150, units: 20 },
  { region: '인천', sales: 510, units: 5 },
  { region: '광주', sales: 270, units: 14 },
];

// 컬럼의 '데이터/행위' 부분만 (render 없음). React/Vue 가 동일하게 소비.
export const columnData = [
  { id: 'region', accessorKey: 'region', header: '지역', enableSorting: true },
  { id: 'sales', accessorKey: 'sales', header: '매출', enableSorting: true },
  { id: 'units', accessorKey: 'units', header: '수량', enableSorting: true },
];

// 공유 row models (table-core — 프레임워크 무관). 양쪽 어댑터가 그대로 사용.
export const sharedRowModels = () => ({
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
});

// 검증용 기대 시나리오 (양 프레임워크가 동일 결과를 내야 함)
export const SCENARIO = {
  sortSalesDesc: [{ id: 'sales', desc: true }], // 매출 내림차순
  // 매출 동률(부산 510, 인천 510) → 안정 정렬 기대. 기대 region 순서:
  expectedSalesDescRegions: ['부산', '인천', '서울', '광주', '대구'],
  filterRegionContains: '주', // '광주' 만 (region 에 '주' 포함)
  expectedFilteredRegions: ['광주'],
};
