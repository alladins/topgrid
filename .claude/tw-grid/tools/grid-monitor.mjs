#!/usr/bin/env node
/** tw-grid monitor — 진행 현황 대시보드 (READ-ONLY) */
import { readFile } from 'fs/promises';

const state = JSON.parse(
  await readFile('.claude/tw-grid/state.json', 'utf-8'),
);

console.log(`tw-grid v${state.version} — ${state.summary.totalGoals} goals`);
console.log(
  `✅ ${state.summary.completed} / 🔄 ${state.summary.inProgress} / ⬜ ${state.summary.pending} / 🚫 ${state.summary.blocked}`,
);
console.log(
  `Tier: high ${state.summary.byTier.high} / medium ${state.summary.byTier.medium} / low ${state.summary.byTier.low}`,
);
console.log(
  `Pkg: open ${state.summary.byPackage.open} / pro ${state.summary.byPackage.pro}`,
);
