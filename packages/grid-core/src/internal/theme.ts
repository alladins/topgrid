/**
 * Grid chrome theming via CSS custom properties (MOD-GRID-29 G-2) — pure.
 *
 * ★ Mechanism (advisor / spec P27-1): the only browser harness (storybook) has NO Tailwind, so a
 * Tailwind-arbitrary class (`bg-[var(--x)]`) is INERT there and a consumer's Tailwind config can't
 * be assumed by a headless package. So theming is driven by **inline CSS custom properties on the
 * grid root** (`--topgrid-*`), and each chrome surface reads them with `var(--topgrid-x, <hex>)`
 * where `<hex>` is the current default. `themeToVars` emits ONLY the overridden keys, so when no
 * theme is set the root carries no vars and every surface falls back to its literal default
 * (default-on byte-identical).
 *
 * ★ This module is pure (node-testable for the KEY→VAR mapping only). Whether a var actually flows
 * root→surface and paints is a BROWSER claim — verified by computed-style, never asserted from node
 * (the "green function, never rendered" trap = LESS-006 for theming).
 *
 * ⚠ CSS vars do NOT survive `forced-colors: active` (the UA overrides background/color/border
 * regardless of whether the value came from a literal or a var). So theming gives ZERO
 * high-contrast benefit — HC-safe selection is a SEPARATE structural mechanism (its own sub-step).
 */

/**
 * Themeable grid chrome colors. All optional via `Partial<GridTheme>` on the `theme` prop.
 *
 * Only STATIC surfaces are themeable this way — a surface whose color lives in a `:hover` or
 * `:focus-visible` pseudo-state (selection bg, focus outline) can't be set by an inline style and
 * is intentionally absent (it would need shipped CSS). Those are handled by the selection sub-step.
 */
export interface GridTheme {
  /** Header (thead / group-header) background. Default `#f9fafb` (gray-50). */
  headerBg: string;
}

/** Theme key → CSS custom property name. Single source for both `themeToVars` and the `var()` reads. */
const VAR_OF: Record<keyof GridTheme, string> = {
  headerBg: '--topgrid-header-bg',
};

/**
 * Map a partial theme to the CSS-custom-property object applied (inline) on the grid root.
 * Emits ONLY provided keys — absent keys carry no var, so surfaces fall back to their literal
 * default. Returns `{}` for no theme (root stays var-free → default-on byte-identical).
 */
export function themeToVars(theme?: Partial<GridTheme>): Record<string, string> {
  if (!theme) return {};
  const vars: Record<string, string> = {};
  for (const key of Object.keys(theme) as (keyof GridTheme)[]) {
    const value = theme[key];
    if (value !== undefined) vars[VAR_OF[key]] = value;
  }
  return vars;
}
