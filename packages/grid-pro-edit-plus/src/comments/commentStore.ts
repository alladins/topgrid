/**
 * 셀 코멘트 순수 코어 — MOD-GRID-23 G-4. React·storage 무의존(순수) → node 전수 검증.
 *
 * 코멘트는 `Map<commentKey, string>`. `commentKey(rowKey, columnId)` 가 충돌 없는 합성 키를
 * 만든다(`JSON.stringify([rowKey, columnId])`). 영속화는 버전 봉투(`{v,c}`)로 직렬화하고,
 * 손상/버전 불일치 시 **빈 Map**으로 복원한다(grid-core `useStoragePersist` 봉투 규약과 동형 —
 * 코드가 아니라 *규약* 재사용. internal/storage 는 비-public 이라 의존 안 함, [[LESS-005]]).
 */

/** 충돌 없는 셀 코멘트 키. */
export function commentKey(rowKey: string, columnId: string): string {
  return JSON.stringify([rowKey, columnId]);
}

/** 코멘트 Map → 버전 봉투 JSON 문자열. */
export function serializeComments(
  comments: ReadonlyMap<string, string>,
  version = 1,
): string {
  return JSON.stringify({ v: version, c: Object.fromEntries(comments) });
}

/**
 * 버전 봉투 JSON → 코멘트 Map. `null`/파싱 실패/버전 불일치/형식 오류 → **빈 Map**(throw 없음).
 */
export function deserializeComments(
  raw: string | null,
  version = 1,
): Map<string, string> {
  if (raw === null) return new Map();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as { v?: unknown }).v !== version ||
      typeof (parsed as { c?: unknown }).c !== 'object' ||
      (parsed as { c?: unknown }).c === null
    ) {
      return new Map();
    }
    const entries = Object.entries(
      (parsed as { c: Record<string, unknown> }).c,
    ).filter((e): e is [string, string] => typeof e[1] === 'string');
    return new Map(entries);
  } catch {
    return new Map();
  }
}
