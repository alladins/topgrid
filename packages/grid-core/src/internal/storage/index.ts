/**
 * @file internal/storage/index — barrel for storage primitives (ADR-007).
 *
 * @internal
 * **Not part of the semver-stable public API.** Exposed as a subpath
 * (`@topgrid/grid-core/internal/storage`) solely to allow sister packages
 * within this monorepo (`@topgrid/grid-pro-master`) to share the SSR-guard +
 * try/catch + JSON I/O primitives without duplicating boilerplate.
 *
 * Subject to breaking changes in minor releases. Application code MUST NOT
 * import from this subpath — use the persistence hooks
 * (`useStoragePersist`, `useColumnPersistence`, `useColumnOrderPersist`,
 * `useExpandedPersistence`) instead.
 *
 * @see MOD-GRID-REFACTOR-2026-05-17-decisions.md ADR-007
 */

export {
  getStorage,
  readJson,
  readRaw,
  writeJson,
  writeRaw,
  removeKey,
  type StorageType,
} from './storageAdapter';
