/**
 * useChangeTracking — Storybook stories (CSF3, placeholder).
 *
 * Storybook infra (@storybook/react) is deferred to MOD-GRID-99-B.
 * This file keeps the CSF3 convention (Meta default export + named Story
 * exports) only, so it can be lifted into a real story without rewriting
 * once Storybook lands. Type imports only — tsc strict passes guaranteed.
 *
 * G-001 deliverable: AC-009 placeholder + 12-member API enumeration.
 * G-002 update (AC-008): add/edit/delete/reset cycle + 1000-row scenario.
 *
 * @see Spec MOD-GRID-10/G-001 Section 12.2 + Section 13.3
 * @see Spec MOD-GRID-10/G-002 Section 5 AC-008, Section 12 (Storybook story)
 * @see precedent: packages/grid-renderers/src/__stories__/TextCell.stories.tsx
 */
import type { ChangeTrackingAPI } from '../types.js';

const meta = {
  title: 'Pro/useChangeTracking',
  parameters: { layout: 'fullscreen' },
} as const;

export default meta;

/**
 * Basic usage — passthrough rows with required `data` + `rowKey` only.
 * G-001 stub: `tracking.rows` mirrors `config.data`. Imperative writes throw.
 */
export const BasicUsage = {
  args: {
    data: [
      { id: 'r1', name: 'Alpha', amount: 100 },
      { id: 'r2', name: 'Bravo', amount: 200 },
    ],
    rowKey: 'id',
  },
} as const;

/**
 * Advanced usage — mapping + validator + functional `rowKey` + optimistic flag.
 * G-001 stub: signature is exercised; runtime behavior lands in G-002~G-005.
 */
export const AdvancedUsage = {
  args: {
    data: [{ id: 'r1', name: 'Alpha', amount: 100 }],
    rowKey: '(row) => row.id',
    mapping: '{ amount: (row) => row.amount * 1000 }',
    validator: '(row) => ({ valid: row.name.length > 0 })',
    optimistic: true,
  },
} as const;

/**
 * Twelve-member API enumeration — fixes AC-003 surface in CSF3 args block so a
 * future Storybook docs page can pull the list without a separate doc source.
 */
export const ApiSurface = {
  args: {
    members: [
      'rows',
      'added',
      'edited',
      'deleted',
      'addRow',
      'updateRow',
      'deleteRow',
      'undoRow',
      'hasChanges',
      'getChangeSet',
      'resetChanges',
      'commitChanges',
    ] satisfies ReadonlyArray<keyof ChangeTrackingAPI<unknown>>,
  },
} as const;

/**
 * G-002 / AC-008 — full add/edit/delete/reset cycle. Story body lands when
 * `@storybook/react-vite` is wired up (MOD-GRID-99-B); the CSF3 args block
 * documents the scenario so a future docs page can render it without a
 * separate fixture.
 *
 * Cycle:
 *   1. addRow({ name: '신규' })             → tracking.added.length === 1
 *   2. updateRow(key, { name: '수정' })     → tracking.edited / __original snapshot
 *   3. deleteRow(otherKey)                  → tracking.deleted.length === 1
 *   4. resetChanges()                        → hasChanges() === false
 */
export const AddEditDeleteResetCycle = {
  args: {
    data: [
      { id: 'r1', name: 'Alpha', amount: 100 },
      { id: 'r2', name: 'Bravo', amount: 200 },
    ],
    rowKey: 'id',
    cycle: [
      { step: 'addRow', payload: { name: '신규', amount: 0 } },
      { step: 'updateRow', key: 'r1', patch: { name: '수정', amount: 150 } },
      { step: 'deleteRow', key: 'r2' },
      { step: 'resetChanges' },
    ],
    expectations: {
      afterAdd: { added: 1, edited: 0, deleted: 0, hasChanges: true },
      afterUpdate: { added: 1, edited: 1, deleted: 0, hasChanges: true },
      afterDelete: { added: 1, edited: 1, deleted: 1, hasChanges: true },
      afterReset: { added: 0, edited: 0, deleted: 0, hasChanges: false },
    },
  },
} as const;

/**
 * G-002 / AC-008 + AC-005 — 1000-row scenario exercising virtualization
 * compatibility (C-18). Story body lands with the Storybook runtime; the
 * args block declares the dataset shape so the future docs page can render
 * the scenario with @tanstack/react-virtual side-by-side with
 * useChangeTracking.
 */
export const LargeDatasetVirtualization = {
  args: {
    rowCount: 1000,
    rowKey: 'id',
    // The story body will materialize `data` from `rowCount` to keep this
    // file lightweight; the shape below documents one row for the docs page.
    rowShape: { id: 'r0001', name: 'Row 1', amount: 100 },
    virtualization: {
      enabled: true,
      estimatedRowHeight: 32,
      // Exercises the `__rowStatus` marker overlaying virtualized rows.
      mutateRowAt: 500,
    },
  },
} as const;

/**
 * G-005 / AC-009 / D11 Story #1 — `commitChanges` fetcher scenarios.
 *
 * Three branches per spec Section 2.1 branch table:
 *   - B1 success + autoReset=true → dispatch RESET, hasChanges() === false.
 *   - B2 failure + optimistic=true → rollback (RESET), re-throw.
 *   - B3 failure + optimistic=false → state intact, re-throw.
 *
 * The args block documents the mock fetcher per branch; the story body
 * (deferred to MOD-GRID-99-B Storybook runtime) will instantiate hooks +
 * dispatch the cycle programmatically and assert post-state.
 */
export const CommitChangesFetcher = {
  args: {
    data: [
      { id: 'r1', name: 'Alpha', amount: 100 },
      { id: 'r2', name: 'Bravo', amount: 200 },
    ],
    rowKey: 'id',
    branches: [
      {
        name: 'B1 success + autoReset',
        cycle: [
          { step: 'updateRow', key: 'r1', patch: { amount: 150 } },
          { step: 'commitChanges', endpoint: '/api/save', options: { autoReset: true } },
        ],
        fetcher: '() => Promise.resolve({ ok: true })',
        expectations: {
          afterCommit: { hasChanges: false, edited: 0, threw: false },
        },
      },
      {
        name: 'B2 failure + optimistic=true → rollback',
        cycle: [
          { step: 'updateRow', key: 'r1', patch: { amount: 150 } },
          { step: 'commitChanges', endpoint: '/api/save', options: { optimistic: true } },
        ],
        fetcher: '() => Promise.reject(new Error("500"))',
        expectations: {
          afterCommit: { hasChanges: false, edited: 0, threw: true },
        },
      },
      {
        name: 'B3 failure + optimistic=false → state intact',
        cycle: [
          { step: 'updateRow', key: 'r1', patch: { amount: 150 } },
          { step: 'commitChanges', endpoint: '/api/save', options: { optimistic: false } },
        ],
        fetcher: '() => Promise.reject(new Error("500"))',
        expectations: {
          afterCommit: { hasChanges: true, edited: 1, threw: true },
        },
      },
    ],
  },
} as const;

/**
 * G-005 / AC-009 / D11 Story #2 — 1000-row dataset + commitChanges.
 *
 * Combines C-18 virtualization with the new commit flow. Validates that
 * `getChangeSet()` iterates only the changed rows (not the full 1000) and
 * that `@tanstack/react-virtual` (peer through grid-core's `<Grid>` with
 * `enableVirtualization=true`) keeps rendering smooth while tracked edits
 * accumulate.
 */
export const LargeDataset1000Rows = {
  args: {
    rowCount: 1000,
    rowKey: 'id',
    rowShape: { id: 'r0001', name: 'Row 1', amount: 100 },
    cycle: [
      { step: 'updateRow', key: 'r0500', patch: { amount: 999 } },
      { step: 'addRow', payload: { id: 'r1001', name: '신규', amount: 0 } },
      { step: 'deleteRow', key: 'r0250' },
      { step: 'commitChanges', endpoint: '/api/save', options: { autoReset: true } },
    ],
    virtualization: {
      enabled: true,
      estimatedRowHeight: 32,
    },
    expectations: {
      changeSet: { added: 1, updated: 1, removed: 1 },
      afterCommit: { hasChanges: false },
    },
  },
} as const;
