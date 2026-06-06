/**
 * Flat-path → 트리 빌더 (MOD-GRID-48) — 순수, no React/DOM.
 *
 * AG `treeData + getDataPath` 의 headless 데이터-모델 절반: 각 행이 경로(`['A','B','C']`)를 갖는 flat 배열을
 * 계층 트리로 변환한다. 소비자가 결과 roots 를 `<Grid data>` + `getSubRows=(n)=>n.children` 로 넘겨 기존
 * 트리 렌더(getExpandedRowModel + expand 토글/indent)에 태운다. **설정형 auto group column 렌더는 본 모듈 밖**
 * (browser/후속) — 그게 getDataPath 가 🟡 인 이유.
 *
 * ★ synthetic-parent dedup: `['A','X']`+`['A','Y']` → **하나의** 'A' 부모 + 자식 2. explicit row 가 prefix 면
 * (`['A']` row + `['A','X']`) 데이터를 그 group 노드에 부착(AG 동형, order-무관).
 */

/** NUL 구분자(세그먼트에 없을 문자 → 키 충돌-안전, MOD-36 동형). */
const KEY_SEP = String.fromCharCode(0);

/** 트리 노드. `data=null` = path prefix 로만 존재하는 synthetic group. */
export interface TreeNode<TData> {
  /** 이 노드까지의 경로 세그먼트. */
  path: string[];
  /** 안정 키(NUL-join, 충돌-안전). */
  key: string;
  /** explicit 행 데이터, 또는 synthetic 부모면 `null`. */
  data: TData | null;
  /** 자식 노드(first-seen 순). */
  children: TreeNode<TData>[];
}

/** `data` 의 각 행을 `getDataPath` 경로로 계층 트리로 변환(순수). 빈 경로 행은 스킵. */
export function buildTreeFromPaths<TData>(
  data: readonly TData[],
  getDataPath: (row: TData) => string[],
): TreeNode<TData>[] {
  const roots: TreeNode<TData>[] = [];
  const byKey = new Map<string, TreeNode<TData>>();
  const keyOf = (path: string[]): string => path.join(KEY_SEP);

  // 경로(및 모든 prefix) 노드를 보장하고 반환. 부모가 먼저 생성되며 first-seen 위치에 push.
  const ensure = (path: string[]): TreeNode<TData> => {
    const key = keyOf(path);
    const existing = byKey.get(key);
    if (existing) return existing;
    const node: TreeNode<TData> = { path, key, data: null, children: [] };
    byKey.set(key, node);
    if (path.length <= 1) {
      roots.push(node);
    } else {
      ensure(path.slice(0, -1)).children.push(node); // prefix 재귀 보장 → 부모에 push
    }
    return node;
  };

  for (const row of data) {
    const path = getDataPath(row);
    if (path.length === 0) continue; // 빈 경로 = 노드 없음(정의된 스킵)
    ensure(path).data = row; // explicit 행 데이터를 (synthetic 일 수도 있는) 노드에 부착. duplicate full path = last 승.
  }

  return roots;
}
