// MOD-48 node spine — buildTreeFromPaths. Run: node --experimental-strip-types src/internal/buildTreeFromPaths.test.ts
import { buildTreeFromPaths, type TreeNode } from './buildTreeFromPaths.ts';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean): void => { if (c) pass++; else { fail++; console.log('  ❌', n); } };

interface Row { id: string; path: string[] }
const gp = (r: Row) => r.path;
// shape helper: nested [key, dataId|null, [children...]]
const shape = (n: TreeNode<Row>): unknown =>
  [n.path.join('/'), n.data ? n.data.id : null, n.children.map(shape)];

// ── ★ synthetic-parent dedup: ['A','X'] + ['A','Y'] → ONE 'A' parent with 2 children ──
{
  const tree = buildTreeFromPaths<Row>(
    [{ id: 'r1', path: ['A', 'X'] }, { id: 'r2', path: ['A', 'Y'] }],
    gp,
  );
  ok('★ one root (deduped A)', tree.length === 1);
  ok('★ A is synthetic (data=null)', tree[0]!.data === null && tree[0]!.path.join('/') === 'A');
  ok('★ A has 2 children X,Y (first-seen order)',
    tree[0]!.children.length === 2 &&
    tree[0]!.children[0]!.data!.id === 'r1' && tree[0]!.children[1]!.data!.id === 'r2');
}

// ── explicit row that is ALSO a prefix → data attaches to the group node (AG behavior), order-independent ──
{
  // ['A'] explicit BEFORE ['A','X']
  const t1 = buildTreeFromPaths<Row>([{ id: 'a', path: ['A'] }, { id: 'x', path: ['A', 'X'] }], gp);
  ok('explicit-prefix (A before A/X): A.data=a, 1 child', t1[0]!.data!.id === 'a' && t1[0]!.children.length === 1 && t1[0]!.children[0]!.data!.id === 'x');
  // ['A','X'] BEFORE ['A'] explicit → same result (order-independent)
  const t2 = buildTreeFromPaths<Row>([{ id: 'x', path: ['A', 'X'] }, { id: 'a', path: ['A'] }], gp);
  ok('★ explicit-prefix order-independent: A.data=a, 1 child', t2[0]!.data!.id === 'a' && t2[0]!.children.length === 1 && t2[0]!.children[0]!.data!.id === 'x');
}

// ── multi-level: A/B/C synthesizes A and A/B ──
{
  const tree = buildTreeFromPaths<Row>([{ id: 'c', path: ['A', 'B', 'C'] }], gp);
  ok('multi-level: A → A/B → A/B/C',
    JSON.stringify(shape(tree[0]!)) === JSON.stringify(['A', null, [['A/B', null, [['A/B/C', 'c', []]]]]]));
}

// ── duplicate full path → last row wins ──
{
  const tree = buildTreeFromPaths<Row>([{ id: 'first', path: ['A'] }, { id: 'second', path: ['A'] }], gp);
  ok('duplicate full path: last wins', tree.length === 1 && tree[0]!.data!.id === 'second');
}

// ── empty path → skipped (no node) ──
{
  const tree = buildTreeFromPaths<Row>([{ id: 'e', path: [] }, { id: 'a', path: ['A'] }], gp);
  ok('empty path skipped, single A root', tree.length === 1 && tree[0]!.data!.id === 'a');
}

// ── single-segment → root with data ──
{
  const tree = buildTreeFromPaths<Row>([{ id: 'a', path: ['A'] }, { id: 'b', path: ['B'] }], gp);
  ok('two single-segment roots', tree.length === 2 && tree[0]!.data!.id === 'a' && tree[1]!.data!.id === 'b');
}

// ── two shared-prefix branches: A/X, A/Y, B/Z → roots [A(2), B(1)] ──
{
  const tree = buildTreeFromPaths<Row>(
    [{ id: '1', path: ['A', 'X'] }, { id: '2', path: ['A', 'Y'] }, { id: '3', path: ['B', 'Z'] }],
    gp,
  );
  ok('roots A,B; A has 2, B has 1',
    tree.length === 2 && tree[0]!.children.length === 2 && tree[1]!.children.length === 1);
}

// ── NUL-key collision safety: ['A','B'] ≠ ['AB'] (distinct nodes) ──
{
  const tree = buildTreeFromPaths<Row>([{ id: 'ab', path: ['AB'] }, { id: 'a-b', path: ['A', 'B'] }], gp);
  ok('★ NUL-key: [AB] and [A,B] are distinct roots', tree.length === 2);
}

console.log(`buildTreeFromPaths spine: ${pass} passed, ${fail} failed`);
if (fail) throw new Error(`${fail} failed`);
