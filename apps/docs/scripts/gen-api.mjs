/**
 * apps/docs/scripts/gen-api.mjs
 *
 * 소스 TSDoc → 패키지별 한국어 API 레퍼런스(자동 생성). docs/api/<pkg>.md 로 출력.
 * typedoc 을 **JSON 추출기로만** 사용(docusaurus 플러그인 체인 미사용 → 버전 문제 우회) +
 * 전용 렌더러가 사이트 스타일 마크다운으로 변환(내부 표식 정제, MDX 안전).
 *
 * 실행:  pnpm --dir apps/docs gen:api   (또는 node apps/docs/scripts/gen-api.mjs)
 * API 소스가 바뀌면 재실행 후 커밋.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DOCS = dirname(dirname(fileURLToPath(import.meta.url))); // apps/docs
const ROOT = dirname(dirname(DOCS)); // repo root
const PKGDIR = join(ROOT, 'packages');
const OUT = join(DOCS, 'docs', 'api');
const TMP = join(DOCS, '.api-tmp');

// 사이드바 정렬용 우선순위(없으면 알파벳)
const ORDER = ['grid', 'grid-core', 'grid-core-headless', 'grid-renderers', 'grid-features', 'grid-sizing', 'grid-export', 'grid-vue'];

// ── 렌더 헬퍼 ──
function stripIds(s) {
  if (!s) return '';
  return s.replace(/\r\n/g, '\n')
    .replace(/\b(AC|EC|TC|OQ|MOD-GRID|MOD|ADR|PAT|LESS|G|C|R|D)-?[A-Z]?\d+[\w-]*/g, '')
    .replace(/\(\s*[,·\s]*\)/g, '').replace(/[,·]\s*\)/g, ')').replace(/\(\s*[,·]\s*/g, '(')
    .replace(/[ \t]{2,}/g, ' ').replace(/ \./g, '.').replace(/,\s*,/g, ',').replace(/[ \t]+\n/g, '\n').trim();
}
function txt(parts) {
  if (!parts) return '';
  return parts.map((p) => (p.kind === 'inline-tag' ? (p.text || p.target?.name || '') : p.text || '')).join('');
}
const mdxSafe = (s) => s.split(/(`[^`]*`)/g).map((seg, i) => (i % 2 ? seg : seg.replace(/</g, '&lt;').replace(/\{/g, '&#123;'))).join('');
// 산문 줄머리의 import/export 는 MDX 가 ESM 문으로 오인 → zero-width space 로 차단(렌더 무영향).
const ZWSP = String.fromCharCode(0x200b);
const descText = (s) => mdxSafe(stripIds(s)).replace(/^([ \t]*)(import|export)\b/gm, (m, a, b) => a + ZWSP + b);
const tyCell = (s) => s.replace(/\|/g, '\\|');
const descCell = (s) => mdxSafe(stripIds(s).replace(/\n+/g, ' ')).replace(/\|/g, '\\|');

function ty(t) {
  if (!t) return 'unknown';
  switch (t.type) {
    case 'intrinsic': return t.name;
    case 'literal': return JSON.stringify(t.value);
    case 'reference': { const a = t.typeArguments?.length ? `<${t.typeArguments.map(ty).join(', ')}>` : ''; return t.name + a; }
    case 'array': return ty(t.elementType) + '[]';
    case 'union': return t.types.map(ty).join(' | ');
    case 'intersection': return t.types.map(ty).join(' & ');
    case 'reflection': return t.declaration?.children ? '{ … }' : (t.declaration?.signatures ? '(…) => …' : 'object');
    case 'tuple': return `[${(t.elements || []).map(ty).join(', ')}]`;
    case 'indexedAccess': return `${ty(t.objectType)}[${ty(t.indexType)}]`;
    case 'typeOperator': return `${t.operator} ${ty(t.target)}`;
    default: return t.name || t.type || 'unknown';
  }
}
const block = (sig, tag) => (sig.comment?.blockTags || []).find((b) => b.tag === tag);
function seeLine(sig) {
  const sees = (sig?.comment?.blockTags || []).filter((b) => b.tag === '@see');
  const refs = [...new Set(sees.flatMap((s) => txt(s.content).split(/[,\n]/)).map((x) => stripIds(x).replace(/[`{}]/g, '').trim()).filter((x) => x && x.length > 1 && x.length < 40 && !/\s{2,}|[.。]/.test(x)))];
  return refs.length ? `**참고** — ${refs.map((r) => '`' + r + '`').join(', ')}` : '';
}

function renderFn(c) {
  const sig = c.signatures?.[0];
  if (!sig) return '';
  const out = [`### \`${c.name}\``, ''];
  const desc = descText(txt(sig.comment?.summary));
  if (desc) out.push(desc, '');
  const tp = sig.typeParameter?.length ? `<${sig.typeParameter.map((p) => p.name).join(', ')}>` : '';
  const params = (sig.parameters || []).map((p) => `${p.name}: ${ty(p.type)}`).join(', ');
  out.push('```ts', `${c.name}${tp}(${params}): ${ty(sig.type)}`, '```', '');
  if ((sig.parameters || []).some((p) => p.comment)) {
    out.push('| 파라미터 | 타입 | 설명 |', '|---|---|---|');
    for (const p of sig.parameters || []) out.push(`| \`${p.name}\` | \`${tyCell(ty(p.type))}\` | ${descCell(txt(p.comment?.summary))} |`);
    out.push('');
  }
  const ret = block(sig, '@returns');
  if (ret) out.push(`**반환** — ${mdxSafe(stripIds(txt(ret.content)).replace(/\n+/g, ' '))}`, '');
  const ex = block(sig, '@example');
  if (ex) { out.push('**예시**', ''); out.push(txt(ex.content).replace(/\r\n/g, '\n').trim(), ''); }
  const see = seeLine(sig);
  if (see) out.push(see, '');
  return out.join('\n');
}
function renderType(c) {
  const out = [`### \`${c.name}\``, ''];
  const desc = descText(txt(c.comment?.summary));
  if (desc) out.push(desc, '');
  if (c.children?.length) {
    out.push('| 속성 | 타입 | 설명 |', '|---|---|---|');
    for (const m of c.children) {
      const opt = m.flags?.isOptional ? '?' : '';
      out.push(`| \`${m.name}${opt}\` | \`${tyCell(ty(m.type))}\` | ${descCell(txt(m.comment?.summary))} |`);
    }
    out.push('');
  } else if (c.type) { out.push('```ts', `type ${c.name} = ${ty(c.type)}`, '```', ''); }
  return out.join('\n');
}
function renderVar(c) {
  const out = [`### \`${c.name}\``, ''];
  const desc = descText(txt(c.comment?.summary));
  if (desc) out.push(desc, '');
  out.push('```ts', `const ${c.name}: ${ty(c.type)}`, '```', '');
  return out.join('\n');
}

const isReactReturn = (c) => /(ReactElement|ReactNode|JSX\.Element|Element)\b/.test(ty(c.signatures?.[0]?.type));

function renderPackage(pkg, j, meta, pos) {
  const children = j.children || [];
  const hooks = children.filter((c) => c.kind === 64 && /^use[A-Z]/.test(c.name));
  const comps = children.filter((c) => c.kind === 64 && !hooks.includes(c) && /^[A-Z]/.test(c.name) && isReactReturn(c));
  const fns = children.filter((c) => c.kind === 64 && !hooks.includes(c) && !comps.includes(c));
  const types = children.filter((c) => c.kind === 256 || c.kind === 2097152);
  const vars = children.filter((c) => c.kind === 32);

  const tier = meta.license === 'MIT' ? '무료 (MIT)' : '상용 (EULA)';
  const md = [];
  md.push('---', `title: "@topgrid/${pkg}"`, `sidebar_label: "${pkg}"`, `sidebar_position: ${pos}`, '---', '');
  md.push(`# @topgrid/${pkg}`, '');
  if (meta.description) md.push(`> ${mdxSafe(meta.description)} · **${tier}**`, '');
  md.push(':::info 자동 생성', '이 페이지는 소스 코드의 TSDoc 주석에서 자동 생성됩니다(내부 표식 정제). 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 참고.', ':::', '');
  md.push(`총 **${children.length}개** public export — 함수 ${fns.length} · 훅 ${hooks.length} · 컴포넌트 ${comps.length} · 타입 ${types.length} · 상수 ${vars.length}.`, '');
  const section = (title, arr, fn) => { if (arr.length) { md.push(`## ${title}`, ''); for (const c of arr) md.push(fn(c)); } };
  section('컴포넌트', comps, renderFn);
  section('훅 (Hooks)', hooks, renderFn);
  section('함수', fns, renderFn);
  section('타입 · 인터페이스', types, renderType);
  section('상수', vars, renderVar);
  return { md: md.join('\n') + '\n', counts: { total: children.length, fns: fns.length, hooks: hooks.length, comps: comps.length, types: types.length, vars: vars.length } };
}

// ── 오케스트레이션 ──
const packages = readdirSync(PKGDIR).filter((d) => {
  const pj = join(PKGDIR, d, 'package.json');
  if (!existsSync(pj)) return false;
  const j = JSON.parse(readFileSync(pj, 'utf8'));
  return !j.private && existsSync(join(PKGDIR, d, 'src', 'index.ts'));
}).sort((a, b) => { const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b); });

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const summary = [];
let pos = 1;
for (const pkg of packages) {
  const meta = JSON.parse(readFileSync(join(PKGDIR, pkg, 'package.json'), 'utf8'));
  const jsonOut = join(TMP, `${pkg}.json`);
  const opts = { entryPoints: [join(PKGDIR, pkg, 'src', 'index.ts')], tsconfig: join(PKGDIR, pkg, 'tsconfig.json'), excludeInternal: true, skipErrorChecking: true, json: jsonOut, logLevel: 'Error' };
  const optFile = join(TMP, `${pkg}.opts.json`);
  writeFileSync(optFile, JSON.stringify(opts));
  try {
    execSync(`pnpm exec typedoc --options "${optFile}"`, { cwd: DOCS, stdio: 'pipe' });
    const j = JSON.parse(readFileSync(jsonOut, 'utf8'));
    const { md, counts } = renderPackage(pkg, j, meta, pos++);
    writeFileSync(join(OUT, `${pkg}.md`), md);
    summary.push(`  ${pkg.padEnd(28)} ${counts.total} exports (fn ${counts.fns}·hook ${counts.hooks}·comp ${counts.comps}·type ${counts.types}·var ${counts.vars})`);
  } catch (e) {
    summary.push(`  ${pkg.padEnd(28)} ✗ FAILED: ${String(e.message || e).split('\n')[0].slice(0, 80)}`);
  }
}

// 개요 페이지
const overview = [
  '---', 'title: "패키지별 API 레퍼런스"', 'sidebar_label: "개요"', 'sidebar_position: 0', '---', '',
  '# 패키지별 API 레퍼런스 (자동 생성)', '',
  '> 소스 코드의 TSDoc 주석에서 자동 생성된 **패키지별 전체 API**입니다. 큐레이트된 시작용 요약은 [API 레퍼런스](../api-reference) 를 참고하세요.', '',
  '| 패키지 | 설명 |', '|---|---|',
  ...packages.map((p) => { const m = JSON.parse(readFileSync(join(PKGDIR, p, 'package.json'), 'utf8')); return `| [\`@topgrid/${p}\`](./${p}) | ${descCell(m.description || '')} |`; }),
  '',
];
writeFileSync(join(OUT, 'index.md'), overview.join('\n') + '\n');
rmSync(TMP, { recursive: true, force: true });

console.log(`\n생성 완료 — ${packages.length} 패키지 → ${OUT}\n`);
console.log(summary.join('\n'));
