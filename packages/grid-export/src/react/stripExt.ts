/**
 * 파일명에서 알려진 export 확장자(.xlsx/.csv/.pdf)를 떼어 base 로 만든다.
 * 각 export 함수가 포맷에 맞는 확장자를 다시 붙이므로, 다중 포맷 버튼에서
 * "주문목록.xlsx" 를 CSV 로 내보낼 때 "주문목록.xlsx.csv" 가 되는 것을 막는다.
 */
export function stripExt(name?: string): string | undefined {
  if (!name) return undefined;
  return name.replace(/\.(xlsx|csv|pdf)$/i, '');
}
