import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';

const FEATURES: { icon: string; title: string; desc: string }[] = [
  {
    icon: '⚡',
    title: '빠른 온보딩',
    desc: '`createColumns({ id, name, type })` 로 TanStack 지식 없이 컬럼을 선언. 데이터 키 타입 안전(오타는 컴파일 차단).',
  },
  {
    icon: '🚀',
    title: '가상화 + 컬럼 고정',
    desc: '수만 행도 부드러운 스크롤. 행/컬럼 가상화, 좌·우 핀, sticky 헤더.',
  },
  {
    icon: '📊',
    title: '피벗 · 집계',
    desc: '다축 피벗 테이블·소계·전치, 그룹별 합계/평균/카운트, 그룹 패널(DnD).',
  },
  {
    icon: '🌐',
    title: '서버사이드 (SSRM)',
    desc: '블록 lazy 로드·무한 스크롤·뷰포트 행 모델·서버 트리. 대용량 백엔드 연동.',
  },
  {
    icon: '📈',
    title: '차트 17종 (React/Vue)',
    desc: '셀 스파크라인부터 엔터프라이즈 17종까지. BYO 엔진·SSR·동일 코어 멀티프레임워크.',
  },
  {
    icon: '📑',
    title: '스프레드시트',
    desc: 'A1 수식·의존 그래프 재계산·VLOOKUP/날짜/재무 함수·셀 서식/스타일/병합.',
  },
  {
    icon: '✏️',
    title: '편집 · 변경 추적',
    desc: '인라인 편집, 추가/수정/삭제 dirty 추적, 검증 룰, Excel-style 범위 선택·클립보드.',
  },
  {
    icon: '🧩',
    title: '멀티프레임워크',
    desc: '동일 headless 코어(@tanstack/table-core) 위에서 React 18/19 + Vue 3 어댑터.',
  },
];

const SNIPPET = `import { Grid, createColumns } from '@topgrid/grid';

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

function renderDesc(desc: string) {
  // very small inline-code formatter for backtick spans
  const parts = desc.split('`');
  return parts.map((p, i) =>
    i % 2 === 1 ? <code key={i}>{p}</code> : <span key={i}>{p}</span>,
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} — Headless React 그리드`}
      description="TanStack Table v8 기반 Headless React 그리드. 가상화·피벗·집계·서버사이드·차트 17종·스프레드시트. MIT 코어 + Pro, 27 패키지."
    >
      {/* ── HERO ── */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badges}>
            <span className={styles.badge}>TanStack Table v8</span>
            <span className={styles.badge}>React 18/19 · Vue 3</span>
            <span className={styles.badge}>MIT 코어 + Pro</span>
          </div>
          <h1 className={styles.heroTitle}>
            데이터 그리드, <span className={styles.grad}>headless</span> 로.
          </h1>
          <p className={styles.heroSubtitle}>
            TanStack Table v8 기반 <strong>Headless React 그리드</strong> — 가상화·피벗·집계·서버사이드·
            차트 17종·스프레드시트까지. MIT 코어 + Enterprise Pro, <strong>27 패키지</strong>.
          </p>
          <div className={styles.cta}>
            <Link className="button button--primary button--lg" to="/getting-started">
              시작하기 →
            </Link>
            <Link
              className="button button--secondary button--lg"
              href="https://github.com/alladins/topgrid"
            >
              GitHub
            </Link>
          </div>
          <div className={styles.install}>
            <code>npm i @topgrid/grid</code>
          </div>
        </div>
      </header>

      <main>
        {/* ── FEATURES ── */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>한 그리드로, 엔터프라이즈까지</h2>
            <p>커뮤니티(MIT) 코어부터 Pro 기능까지 — 필요한 패키지만 골라 쓴다.</p>
          </div>
          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
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
              <h2>TanStack 지식 없이, 타입 안전하게</h2>
              <p>
                <code>createColumns</code> 가 <code>type</code> 으로 셀 렌더러를 자동 배선하고, 컬럼{' '}
                <code>id</code> 를 <code>keyof TData</code> 로 강제한다. 셀/필터 콜백은 깨끗한{' '}
                <code>GridCellContext</code> 를 받아 TanStack 타입을 import 할 필요가 없다.
              </p>
              <ul className={styles.checks}>
                <li>오타 컬럼 키 = 컴파일 에러</li>
                <li>facade <code>@topgrid/grid</code> 하나로 시작, 트리셰이킹은 개별 패키지로</li>
                <li>완전 제어가 필요하면 raw TanStack <code>ColumnDef</code> 도 그대로 허용</li>
              </ul>
              <Link className="button button--primary" to="/api-reference">
                API 레퍼런스 →
              </Link>
            </div>
            <div className={styles.codeBox}>
              <CodeBlock language="tsx">{SNIPPET}</CodeBlock>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className={styles.ctaBand}>
          <div className={styles.ctaBandInner}>
            <h2>지금 시작하세요</h2>
            <p>설치부터 첫 그리드까지 5분. 도입 검토는 언제든 문의하세요.</p>
            <div className={styles.cta}>
              <Link className="button button--primary button--lg" to="/getting-started">
                문서 보기
              </Link>
              <Link className="button button--secondary button--lg" href="mailto:sales@platree.com">
                도입 문의
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
