import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';

type Feature = { icon: string; title: string; desc: string };

type Content = {
  badges: string[];
  titlePre: string;
  titleGrad: string;
  titlePost: string;
  subtitle: ReactNode;
  ctaStart: string;
  pricingCta: string;
  github: string;
  demoHead: string;
  demoSub: string;
  demoCta: string;
  chartHead: string;
  chartSub: string;
  chartCta: string;
  chartLabelEnt: string;
  chartLabelLight: string;
  chartLabelVue: string;
  featuresHead: string;
  featuresSub: string;
  features: Feature[];
  codeHead: string;
  codeCopy: ReactNode;
  checks: string[];
  apiRef: string;
  snippet: string;
  ctaBandHead: string;
  ctaBandSub: string;
  viewDocs: string;
  contact: string;
};

const SNIPPET_KO = `import { Grid, createColumns } from '@topgrid/grid';

interface User { id: number; name: string; email: string; age: number; }

// type 으로 셀 렌더러 자동 배선 · id 는 keyof User 강제(오타 차단)
const columns = createColumns<User>([
  { id: 'name',  name: '이름',   type: 'text' },
  { id: 'email', name: '이메일', type: 'text' },
  { id: 'age',   name: '나이',   type: 'number', align: 'right' },
]);

export default function App() {
  return (
    <Grid<User>
      data={users}
      columns={columns}
      getRowId={(u) => String(u.id)}
      enableSort
      // clean 콜백 — TanStack 타입 import 불필요
      onCellClick={(ctx) => console.log(ctx.columnId, ctx.value)}
    />
  );
}`;

const SNIPPET_EN = `import { Grid, createColumns } from '@topgrid/grid';

interface User { id: number; name: string; email: string; age: number; }

// 'type' auto-wires the cell renderer; 'id' is forced to keyof User (typos rejected)
const columns = createColumns<User>([
  { id: 'name',  name: 'Name',  type: 'text' },
  { id: 'email', name: 'Email', type: 'text' },
  { id: 'age',   name: 'Age',   type: 'number', align: 'right' },
]);

export default function App() {
  return (
    <Grid<User>
      data={users}
      columns={columns}
      getRowId={(u) => String(u.id)}
      enableSort
      // clean callback — no need to import TanStack types
      onCellClick={(ctx) => console.log(ctx.columnId, ctx.value)}
    />
  );
}`;

const CONTENT: Record<string, Content> = {
  ko: {
    badges: ['TanStack Table v8', 'React 18/19 · Vue 3', 'MIT 코어 + Pro'],
    titlePre: '데이터 그리드, ',
    titleGrad: 'headless',
    titlePost: ' 로.',
    subtitle: (
      <>
        TanStack Table v8 기반 <strong>Headless React 그리드</strong> — 가상화·피벗·집계·서버사이드·
        차트 17종·스프레드시트까지. MIT 코어 + Enterprise Pro, <strong>31 패키지</strong>.
      </>
    ),
    ctaStart: '시작하기 →',
    pricingCta: '가격 보기',
    github: 'GitHub',
    demoHead: '직접 만져보세요',
    demoSub: '아래는 실제 동작하는 그리드입니다 — 헤더를 클릭해 정렬해 보세요. 셀 렌더러(숫자·날짜·배지·링크)가 자동 배선됩니다.',
    demoCta: '전체 데모 (Storybook) →',
    chartHead: '차트도 내장',
    chartSub: '셀 스파크라인부터 엔터프라이즈 17종(Apache ECharts)까지. 아래 차트의 툴바로 막대·선·레이더·히트맵을 바로 전환해 보세요 — React·Vue 3 동일 엔진.',
    chartCta: '차트 가이드 →',
    chartLabelEnt: '엔터프라이즈 (React) — ECharts 17종, 툴바로 라이브 전환',
    chartLabelLight: '경량 (zero-dep SVG) — 스파크라인 · 범위 차트',
    chartLabelVue: 'Vue 3 — 동일 엔진, 라이브 데모',
    featuresHead: '한 그리드로, 엔터프라이즈까지',
    featuresSub: '커뮤니티(MIT) 코어부터 Pro 기능까지 — 필요한 패키지만 골라 쓴다.',
    features: [
      { icon: '⚡', title: '빠른 온보딩', desc: '`createColumns({ id, name, type })` 로 TanStack 지식 없이 컬럼을 선언. 데이터 키 타입 안전(오타는 컴파일 차단).' },
      { icon: '🚀', title: '가상화 + 컬럼 고정', desc: '수만 행도 부드러운 스크롤. 행/컬럼 가상화, 좌·우 핀, sticky 헤더.' },
      { icon: '📊', title: '피벗 · 집계', desc: '다축 피벗 테이블·소계·전치, 그룹별 합계/평균/카운트, 그룹 패널(DnD).' },
      { icon: '🌐', title: '서버사이드 (SSRM)', desc: '블록 lazy 로드·무한 스크롤·뷰포트 행 모델·서버 트리. 대용량 백엔드 연동.' },
      { icon: '📈', title: '차트 17종 (React/Vue)', desc: '셀 스파크라인부터 엔터프라이즈 17종까지. BYO 엔진·SSR·동일 코어 멀티프레임워크.' },
      { icon: '📑', title: '스프레드시트', desc: 'A1 수식·의존 그래프 재계산·VLOOKUP/날짜/재무 함수·셀 서식/스타일/병합.' },
      { icon: '✏️', title: '편집 · 변경 추적', desc: '인라인 편집, 추가/수정/삭제 dirty 추적, 검증 룰, Excel-style 범위 선택·클립보드.' },
      { icon: '🧩', title: '멀티프레임워크', desc: '동일 headless 코어(@tanstack/table-core) 위에서 React 18/19 + Vue 3 어댑터.' },
    ],
    codeHead: 'TanStack 지식 없이, 타입 안전하게',
    codeCopy: (
      <>
        <code>createColumns</code> 가 <code>type</code> 으로 셀 렌더러를 자동 배선하고, 컬럼{' '}
        <code>id</code> 를 <code>keyof TData</code> 로 강제한다. 셀/필터 콜백은 깨끗한{' '}
        <code>GridCellContext</code> 를 받아 TanStack 타입을 import 할 필요가 없다.
      </>
    ),
    checks: [
      '오타 컬럼 키 = 컴파일 에러',
      'facade @topgrid/grid 하나로 시작, 트리셰이킹은 개별 패키지로',
      '완전 제어가 필요하면 raw TanStack ColumnDef 도 그대로 허용',
    ],
    apiRef: 'API 레퍼런스 →',
    snippet: SNIPPET_KO,
    ctaBandHead: '지금 시작하세요',
    ctaBandSub: '설치부터 첫 그리드까지 5분. 도입 검토는 언제든 문의하세요.',
    viewDocs: '문서 보기',
    contact: '도입 문의',
  },
  en: {
    badges: ['TanStack Table v8', 'React 18/19 · Vue 3', 'MIT core + Pro'],
    titlePre: 'Data grids, ',
    titleGrad: 'headless',
    titlePost: '.',
    subtitle: (
      <>
        A <strong>headless React grid</strong> built on TanStack Table v8 — virtualization, pivoting,
        aggregation, server-side, 17 chart types, spreadsheet. MIT core + Enterprise Pro,{' '}
        <strong>31 packages</strong>.
      </>
    ),
    ctaStart: 'Get Started →',
    pricingCta: 'View Pricing',
    github: 'GitHub',
    demoHead: 'Try it live',
    demoSub: 'A real, running grid below — click a header to sort. Cell renderers (number, date, badge, link) are wired automatically by type.',
    demoCta: 'Full demos (Storybook) →',
    chartHead: 'Charts, built in',
    chartSub: 'From cell sparklines to 17 enterprise types (Apache ECharts). Use the toolbar in the chart below to switch bar/line/radar/heatmap live — the same engine on React and Vue 3.',
    chartCta: 'Charting guide →',
    chartLabelEnt: 'Enterprise (React) — 17 ECharts types, switch live via the toolbar',
    chartLabelLight: 'Lightweight (zero-dep SVG) — sparkline · range chart',
    chartLabelVue: 'Vue 3 — same engine, live demo',
    featuresHead: 'From one grid to enterprise',
    featuresSub: 'From the MIT community core to Pro features — install only the packages you need.',
    features: [
      { icon: '⚡', title: 'Fast onboarding', desc: 'Declare columns with `createColumns({ id, name, type })` — no TanStack knowledge. Column keys are type-safe (typos fail at compile time).' },
      { icon: '🚀', title: 'Virtualization + pinning', desc: 'Smooth scrolling over tens of thousands of rows. Row/column virtualization, left/right pinning, sticky headers.' },
      { icon: '📊', title: 'Pivot · aggregation', desc: 'Multi-axis pivot tables, subtotals, transpose, per-group sum/avg/count, drag-and-drop group panel.' },
      { icon: '🌐', title: 'Server-side (SSRM)', desc: 'Block lazy-loading, infinite scroll, viewport row model, server-side tree. Connect large backends.' },
      { icon: '📈', title: '17 chart types (React/Vue)', desc: 'From cell sparklines to 17 enterprise chart types. BYO engine, SSR, one shared core across frameworks.' },
      { icon: '📑', title: 'Spreadsheet', desc: 'A1 formulas, dependency-graph recalculation, VLOOKUP / date / financial functions, cell formatting / styles / merging.' },
      { icon: '✏️', title: 'Editing · change tracking', desc: 'Inline editing, add/update/delete dirty tracking, validation rules, Excel-style range selection and clipboard.' },
      { icon: '🧩', title: 'Multi-framework', desc: 'React 18/19 + Vue 3 adapters on the same headless core (@tanstack/table-core).' },
    ],
    codeHead: 'Type-safe, without TanStack knowledge',
    codeCopy: (
      <>
        <code>createColumns</code> auto-wires cell renderers by <code>type</code> and enforces the
        column <code>id</code> as <code>keyof TData</code>. Cell and filter callbacks receive a clean{' '}
        <code>GridCellContext</code>, so you never import TanStack types.
      </>
    ),
    checks: [
      'A typo in a column key = a compile error',
      'Start with the @topgrid/grid facade; tree-shake via individual packages',
      'Need full control? Raw TanStack ColumnDef still works',
    ],
    apiRef: 'API Reference →',
    snippet: SNIPPET_EN,
    ctaBandHead: 'Get started today',
    ctaBandSub: 'Five minutes from install to your first grid. Reach out anytime to evaluate adoption.',
    viewDocs: 'View Docs',
    contact: 'Contact Sales',
  },
};

function renderDesc(desc: string) {
  const parts = desc.split('`');
  return parts.map((p, i) =>
    i % 2 === 1 ? <code key={i}>{p}</code> : <span key={i}>{p}</span>,
  );
}

export default function Home() {
  const { siteConfig, i18n } = useDocusaurusContext();
  const t = CONTENT[i18n.currentLocale] ?? CONTENT.ko;
  return (
    <Layout
      title={`${siteConfig.title} — Headless React grid`}
      description="A headless React grid built on TanStack Table v8. Virtualization, pivoting, aggregation, server-side, 17 chart types, spreadsheet. MIT core + Pro, 31 packages."
    >
      {/* ── HERO ── */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badges}>
            {t.badges.map((b) => (
              <span key={b} className={styles.badge}>
                {b}
              </span>
            ))}
          </div>
          <h1 className={styles.heroTitle}>
            {t.titlePre}
            <span className={styles.grad}>{t.titleGrad}</span>
            {t.titlePost}
          </h1>
          <p className={styles.heroSubtitle}>{t.subtitle}</p>
          <div className={styles.cta}>
            <Link className="button button--primary button--lg" to="/getting-started">
              {t.ctaStart}
            </Link>
            <Link className="button button--secondary button--lg" to="/pricing">
              {t.pricingCta}
            </Link>
            <Link
              className="button button--secondary button--lg"
              href="https://github.com/alladins/topgrid"
            >
              {t.github}
            </Link>
          </div>
          <div className={styles.install}>
            <code>npm i @topgrid/grid</code>
          </div>
        </div>
      </header>

      <main>
        {/* ── LIVE DEMO (storybook iframe — 그리드에 Tailwind 적용된 실 컴포넌트) ── */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{t.demoHead}</h2>
            <p>{t.demoSub}</p>
          </div>
          <div className={styles.demoFrame}>
            <iframe
              src="/storybook/iframe.html?id=grid-core-grid-withregistryrenderers--default&viewMode=story"
              title="topgrid live demo"
              loading="lazy"
            />
          </div>
          <div className={styles.demoCtaRow}>
            <Link className="button button--secondary" href="/storybook/" target="_blank">
              {t.demoCta}
            </Link>
          </div>
        </section>

        {/* ── CHART DEMOS (엔터프라이즈 React + 2단 경량 + Vue 라이브) ── */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{t.chartHead}</h2>
            <p>{t.chartSub}</p>
          </div>

          {/* 엔터프라이즈 (React) — 툴바로 17종 라이브 전환 */}
          <div className={styles.chartLabel}>{t.chartLabelEnt}</div>
          <div className={styles.demoFrame}>
            <iframe
              src="/storybook/iframe.html?id=grid-pro-chart-enterprise-enterprisechartpanel--default&viewMode=story"
              title="topgrid enterprise chart demo"
              loading="lazy"
            />
          </div>

          {/* 경량 (zero-dep SVG) — 스파크라인 · 범위 차트 2단 */}
          <div className={styles.chartLabel}>{t.chartLabelLight}</div>
          <div className={styles.chartPair}>
            <div>
              <iframe
                src="/storybook/iframe.html?id=grid-pro-chart-sparkline--area-with-markers&viewMode=story"
                title="스파크라인 데모"
                loading="lazy"
              />
            </div>
            <div>
              <iframe
                src="/storybook/iframe.html?id=grid-pro-chart-rangechart--multi-series&viewMode=story"
                title="범위 차트 데모"
                loading="lazy"
              />
            </div>
          </div>

          {/* Vue 3 — 동일 엔진 라이브 데모(별도 정적 번들) */}
          <div className={styles.chartLabel}>{t.chartLabelVue}</div>
          <div className={styles.demoFrame}>
            <iframe src="/vue-chart-demo/" title="topgrid Vue 3 chart demo" loading="lazy" />
          </div>

          <div className={styles.demoCtaRow}>
            <Link className="button button--secondary" to="/charting">
              {t.chartCta}
            </Link>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{t.featuresHead}</h2>
            <p>{t.featuresSub}</p>
          </div>
          <div className={styles.featureGrid}>
            {t.features.map((f) => (
              <div key={f.title} className={styles.card}>
                <div className={styles.cardIcon} aria-hidden>
                  {f.icon}
                </div>
                <h3 className={styles.cardTitle}>{f.title}</h3>
                <p className={styles.cardDesc}>{renderDesc(f.desc)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CODE SHOWCASE ── */}
        <section className={`${styles.section} ${styles.codeSection}`}>
          <div className={styles.codeGrid}>
            <div className={styles.codeCopy}>
              <h2>{t.codeHead}</h2>
              <p>{t.codeCopy}</p>
              <ul className={styles.checks}>
                {t.checks.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <Link className="button button--primary" to="/api-reference">
                {t.apiRef}
              </Link>
            </div>
            <div className={styles.codeBox}>
              <CodeBlock language="tsx">{t.snippet}</CodeBlock>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className={styles.ctaBand}>
          <div className={styles.ctaBandInner}>
            <h2>{t.ctaBandHead}</h2>
            <p>{t.ctaBandSub}</p>
            <div className={styles.cta}>
              <Link className="button button--primary button--lg" to="/getting-started">
                {t.viewDocs}
              </Link>
              <Link className="button button--secondary button--lg" to="/pricing#inquiry">
                {t.contact}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
