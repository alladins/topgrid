/**
 * `applyRowDraft` — 행 편집 draft(변경 셀 모음)를 원본 행에 머지 (MOD-GRID-50 G-1).
 *
 * 순수 함수 (node 검증). full-row editing 의 커밋 단위 = 행 전체 all-or-nothing 의 핵심 변환.
 * draft 에 담긴 필드만 override 하고 새 객체를 반환한다(입력 불변, applyRowTransaction/moveRow 동형).
 *
 * @param row   원본 행 객체.
 * @param draft 변경 셀 `{ [field]: value }`. 빈 객체면 원본의 동등 복사.
 * @returns 머지된 새 행(`{ ...row, ...draft }`). 원본 무변.
 */
export function applyRowDraft<T extends object>(row: T, draft: Record<string, unknown>): T {
  return { ...row, ...draft } as T;
}
