/**
 * A1-notation address helpers (MOD-GRID-26 G-1) — pure. Column letters ↔ 0-based index,
 * and range expansion (`A1:B2` → `[A1,A2,B1,B2]`).
 */

/** Parse `"A1"` → `{ col, row }` (0-based). Throws on malformed input. */
export function parseA1(ref: string): { col: number; row: number } {
  const m = /^([A-Z]+)([0-9]+)$/.exec(ref);
  if (!m) throw new Error(`invalid cell ref: ${ref}`);
  let col = 0;
  for (const ch of m[1]!) col = col * 26 + (ch.charCodeAt(0) - 64); // A=1
  return { col: col - 1, row: Number(m[2]) - 1 };
}

/** Format a 0-based column index → its letters (`0`→`"A"`, `26`→`"AA"`). MOD-GRID-40: shared by toA1 + serializer. */
export function colToLetters(col: number): string {
  let letters = '';
  let c = col + 1;
  while (c > 0) {
    const rem = (c - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    c = Math.floor((c - 1) / 26);
  }
  return letters;
}

/** Format `{ col, row }` (0-based) → `"A1"`. */
export function toA1(col: number, row: number): string {
  return `${colToLetters(col)}${row + 1}`;
}

/** Expand `A1:B2` (inclusive, order-normalized) → cell refs `[A1, A2, B1, B2]` (column-major). */
export function expandRange(from: string, to: string): string[] {
  const a = parseA1(from);
  const b = parseA1(to);
  const c0 = Math.min(a.col, b.col);
  const c1 = Math.max(a.col, b.col);
  const r0 = Math.min(a.row, b.row);
  const r1 = Math.max(a.row, b.row);
  const out: string[] = [];
  for (let c = c0; c <= c1; c++) {
    for (let r = r0; r <= r1; r++) out.push(toA1(c, r));
  }
  return out;
}
