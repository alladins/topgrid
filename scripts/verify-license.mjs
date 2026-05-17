#!/usr/bin/env node
// scripts/verify-license.mjs
// 릴리스 검증: 모든 패키지의 license 필드 + EULA.md/LICENSE 파일 존재 확인
// Usage: node scripts/verify-license.mjs
// Exit 0: 모두 통과 | Exit 1: 누락 발견

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagesDir = join(__dirname, '..', 'packages');

// 패키지 순회
const packages = readdirSync(packagesDir).filter(name => {
  const pkgPath = join(packagesDir, name, 'package.json');
  return existsSync(pkgPath) && statSync(join(packagesDir, name)).isDirectory();
});

let errors = [];

for (const pkgName of packages) {
  const pkgDir = join(packagesDir, pkgName);
  const pkgJsonPath = join(pkgDir, 'package.json');
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));

  // license 필드 확인
  if (!pkgJson.license) {
    errors.push(`[MISSING license field] ${pkgJson.name ?? pkgName}`);
    continue;
  }

  // SEE LICENSE IN EULA → EULA.md 확인
  if (pkgJson.license === 'SEE LICENSE IN EULA') {
    if (!existsSync(join(pkgDir, 'EULA.md'))) {
      errors.push(`[MISSING EULA.md] ${pkgJson.name ?? pkgName}`);
    }
  }

  // MIT → LICENSE 확인
  if (pkgJson.license === 'MIT') {
    if (!existsSync(join(pkgDir, 'LICENSE'))) {
      errors.push(`[MISSING LICENSE] ${pkgJson.name ?? pkgName}`);
    }
  }
}

if (errors.length > 0) {
  console.error('[verify-license] FAILED:');
  errors.forEach(e => console.error(' ', e));
  process.exit(1);
} else {
  console.log(`[verify-license] PASSED: ${packages.length} packages OK`);
  process.exit(0);
}
