/**
 * `useDeprecationWarn(name)` — 5 legacy alias 공통 dev mode 1회 console.warn (G-005 D3/D4).
 *
 * @remarks
 * - dev mode 1회 (`useRef` guard) — React 19 StrictMode 2회 effect + HMR re-mount 시도 폭주 차단.
 * - production silent (`process.env.NODE_ENV === 'production'` skip).
 * - 메시지 형식: `[tomis/grid-core] {name} is deprecated, migrate to <Grid>. See migration guide.`
 * - `useGridImperativeHandle.ts` L41 dev guard 패턴과 일관 (single occurrence promotion 보류 — 본
 *   파일이 5 alias 공통 caller 가 되어 G-005 retro 시점 helper promotion 검토).
 *
 * @see G-005-spec.md Section 2.6 + D3/D4
 */

import { useEffect, useRef } from 'react';

// Node `process` global 의 minimal local declare — `@types/node` 미설치 환경 대비 (C-4 준수).
// `Grid.tsx` L54 + `useGridImperativeHandle.ts` L44 와 동일 패턴.
declare const process: { env: { NODE_ENV?: string } } | undefined;

export function useDeprecationWarn(name: string): void {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    if (typeof process === 'undefined' || process?.env?.NODE_ENV === 'production') return;
    fired.current = true;
    console.warn(
      `[tomis/grid-core] ${name} is deprecated, migrate to <Grid>. See migration guide.`,
    );
    // mount 시 1회 (deps 의도적 비움) — name 고정 + ref guard 로 StrictMode/HMR 호환.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
