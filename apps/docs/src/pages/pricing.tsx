import { useState, type ReactNode, type FormEvent, type MouseEvent } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './pricing.module.css';

type Tier = {
  name: string;
  forWho: string;
  price: string;
  priceUnit: string;
  priceSub: string;
  feats: string[];
  cta: string;
  ctaHref: string;
  hot?: boolean;
  hotLabel?: string;
};

type Faq = { q: string; a: ReactNode };

type Content = {
  title: string;
  subtitle: string;
  promo: string;
  tiers: Tier[];
  includesHead: string;
  includes: string[];
  faqHead: string;
  faqs: Faq[];
  bottomHead: string;
  bottomCta: string;
  bottomHref: string;
  form: {
    head: string;
    sub: string;
    company: string;
    email: string;
    type: string;
    types: { trial: string; purchase: string; enterprise: string; other: string };
    domain: string;
    message: string;
    submit: string;
    sending: string;
    done: string;
    errPrefix: string;
  };
};

const TRIAL_KO = `mailto:sales@platree.com?subject=${encodeURIComponent('[Trial] topgrid 30일 평가 키 신청')}&body=${encodeURIComponent('회사/소속:\n적용 도메인(개발용):\n간단한 용도 설명:\n')}`;
const TRIAL_EN = `mailto:sales@platree.com?subject=${encodeURIComponent('[Trial] topgrid 30-day evaluation key request')}&body=${encodeURIComponent('Company:\nDomain (for development):\nBrief description of use case:\n')}`;

const CONTENT: Record<string, Content> = {
  ko: {
    title: '가격',
    subtitle: '도메인당 라이선스 — 개발자·서버·프로젝트 무제한. 상용 24개 패키지 전부 포함.',
    promo: '🚀 런칭 프로모션 — 얼리어답터 첫 10개 고객사 50% 할인 (도입 사례 협력 조건)',
    tiers: [
      {
        name: 'Community',
        forWho: '기본 그리드로 충분한 프로젝트',
        price: '무료',
        priceUnit: 'MIT 라이선스',
        priceSub: '코어 7패키지 — 그리드·정렬·필터·렌더러·사이징·내보내기·Vue 어댑터',
        feats: ['상업적 사용 포함 무료', '기본 Grid + 가상화 + 페이지네이션', '셀 렌더러 11종', 'Excel/CSV/PDF 내보내기'],
        cta: '시작하기',
        ctaHref: '/getting-started',
      },
      {
        name: 'Pro — Internal',
        forWho: '사내·인트라넷 시스템 (내부 사용자)',
        price: '₩350만',
        priceUnit: '도메인당 · 영구 · VAT 별도',
        priceSub: '유지보수 연 15% (첫 1년 무상 포함) · 연간 구독 옵션 문의',
        feats: ['상용 24패키지 전부', '차트 17종 · 피벗 · 서버사이드 · 스프레드시트', '개발자·서버 무제한', '비프로덕션(dev/stage) 도메인 2개 무료'],
        cta: '구매 문의',
        ctaHref: '#inquiry:purchase',
        hot: true,
        hotLabel: '가장 인기',
      },
      {
        name: 'Pro — SaaS/External',
        forWho: '외부 사용자 노출 · 유료 서비스',
        price: '₩700만',
        priceUnit: '도메인당 · 영구 · VAT 별도',
        priceSub: '유지보수 연 15% (첫 1년 무상 포함) · 연간 구독 옵션 문의',
        feats: ['Pro Internal의 전부', '외부 고객 대상 서비스 허용', 'SaaS 프로덕션 도메인', '우선 이메일 지원'],
        cta: '구매 문의',
        ctaHref: '#inquiry:purchase',
      },
      {
        name: 'Enterprise',
        forWho: '다수 도메인 · 전사 표준화',
        price: '협의',
        priceUnit: '사내 도메인 무제한',
        priceSub: '도메인 7개 이상이면 Enterprise가 유리합니다',
        feats: ['사내 도메인 무제한', '와일드카드(*.company.com) 지원', '우선 기술 지원', 'OEM/재배포 별도 협의'],
        cta: '도입 문의',
        ctaHref: '#inquiry:enterprise',
      },
    ],
    includesHead: '모든 Pro 라이선스 공통',
    includes: [
      '상용 24개 패키지 전부 — 별도 추가 구매 없음',
      '엔터프라이즈 차트 17종 기본 포함 (별매 아님)',
      '개발자 수 · 서버 · CPU 코어 · 프로젝트 수 무제한',
      '비프로덕션(dev/stage) 도메인 2개 무료 + localhost 항상 무료',
      '30일 무료 평가 키 (전 기능)',
      '45일 환불 보장',
      'React 18/19 + Vue 3 — 동일 라이선스로 양쪽 사용',
      '첫 1년 기술지원 · 업데이트 무상',
    ],
    faqHead: '자주 묻는 질문',
    faqs: [
      {
        q: '"도메인당"의 기준이 무엇인가요?',
        a: (
          <p>
            운영 서비스가 서빙되는 도메인(FQDN) 1개 기준입니다. 예: <code>erp.company.com</code> = 1
            라이선스. 서버 대수·CPU 코어·프로젝트 수·개발자 수는 세지 않습니다. 비프로덕션(개발/스테이징)
            도메인 2개가 무료로 포함되고 <code>localhost</code>는 항상 무료입니다. 서브도메인이 많다면
            와일드카드를 지원하는 Enterprise를 문의하세요.
          </p>
        ),
      },
      {
        q: '개발자 수 제한이 정말 없나요?',
        a: (
          <p>
            없습니다. 타사 엔터프라이즈 그리드 대부분은 개발자 좌석당 연 수십~수백만 원을 과금하지만,
            topgrid는 배포 도메인 기준입니다. 팀이 3명이든 30명이든 가격이 같습니다.
          </p>
        ),
      },
      {
        q: '라이선스는 어떻게 적용하나요?',
        a: (
          <p>
            발급받은 키를 앱 진입점에서 <code>setLicenseKey('...')</code> 한 줄로 등록하면 됩니다. 검증은
            런타임(브라우저)에서 이루어지며 빌드·배포 파이프라인에는 영향이 없습니다. Nuxt/Next SSR·SSG
            안전.
          </p>
        ),
      },
      {
        q: '키 없이 쓰면 어떻게 되나요?',
        a: (
          <p>
            Pro 컴포넌트에 워터마크가 표시될 뿐 기능은 전부 동작합니다. 먼저 자유롭게 붙여보고
            결정하세요. 평가용 30일 키를 받으면 워터마크 없이 검증할 수 있습니다.
          </p>
        ),
      },
      {
        q: '유지보수(2년차~)에는 무엇이 포함되나요?',
        a: (
          <p>
            구매액의 연 15%로 전 버전 업데이트(신기능 포함)와 기술지원이 제공됩니다. 첫 1년은 구매에 무상
            포함. 유지보수를 갱신하지 않아도 보유 버전은 영구히 사용할 수 있습니다.
          </p>
        ),
      },
      {
        q: 'Community(무료)와 Pro의 경계는 어디인가요?',
        a: (
          <p>
            기본 그리드·정렬·필터·렌더러·내보내기·Vue 어댑터 등 코어 7패키지는 MIT 무료입니다. 피벗·집계·
            서버사이드·차트·스프레드시트·변경추적·범위선택 등 24개 패키지가 Pro입니다. 전체 구성은{' '}
            <Link to="/architecture">아키텍처</Link> 문서를 참고하세요.
          </p>
        ),
      },
      {
        q: '해외 결제(USD)도 가능한가요?',
        a: (
          <p>
            네. 글로벌 고객은 연간 구독 — Internal $990/년, SaaS $1,990/년(도메인당) — 또는 영구(연간의
            3배)로 구매할 수 있습니다. 문의 주시면 견적서(USD)를 보내드립니다.
          </p>
        ),
      },
    ],
    bottomHead: '30일이면 충분합니다 — 전 기능으로 직접 검증하세요.',
    bottomCta: '30일 평가 키 신청 →',
    bottomHref: TRIAL_KO,
    form: {
      head: '바로 문의하기',
      sub: '아래 폼으로 보내주시면 1영업일 내 답변드립니다. (이메일이 편하시면 위 버튼들을 이용하세요)',
      company: '회사 / 성함',
      email: '이메일 *',
      type: '문의 유형',
      types: { trial: '30일 평가 키', purchase: '구매 견적', enterprise: 'Enterprise / OEM', other: '기타' },
      domain: '적용 도메인 (선택)',
      message: '문의 내용',
      submit: '문의 보내기',
      sending: '전송 중…',
      done: '✅ 접수되었습니다. 1영업일 내 이메일로 답변드리겠습니다.',
      errPrefix: '전송 실패: ',
    },
  },
  en: {
    title: 'Pricing',
    subtitle: 'Licensed per domain — unlimited developers, servers, and projects. All 24 commercial packages included.',
    promo: '🚀 Launch promo — 50% off for the first 10 early-adopter customers (case-study partnership)',
    tiers: [
      {
        name: 'Community',
        forWho: 'Projects that only need the core grid',
        price: 'Free',
        priceUnit: 'MIT license',
        priceSub: '7 core packages — grid, sorting, filtering, renderers, sizing, export, Vue adapter',
        feats: ['Free for commercial use', 'Core Grid + virtualization + pagination', '11 cell renderers', 'Excel/CSV/PDF export'],
        cta: 'Get started',
        ctaHref: '/getting-started',
      },
      {
        name: 'Pro — Internal',
        forWho: 'Internal / intranet apps (internal users)',
        price: '$990',
        priceUnit: 'per domain / year',
        priceSub: 'Less than a single per-developer seat elsewhere — with unlimited developers. Perpetual: $2,970.',
        feats: ['All 24 commercial packages', '17 chart types · pivot · server-side · spreadsheet', 'Unlimited developers & servers', '2 non-production (dev/stage) domains free'],
        cta: 'Contact sales',
        ctaHref: '#inquiry:purchase',
        hot: true,
        hotLabel: 'Most popular',
      },
      {
        name: 'Pro — SaaS/External',
        forWho: 'External-facing / paid services',
        price: '$1,990',
        priceUnit: 'per domain / year',
        priceSub: 'For products exposed to external users. Perpetual: $5,970.',
        feats: ['Everything in Pro Internal', 'External customer-facing use', 'SaaS production domains', 'Priority email support'],
        cta: 'Contact sales',
        ctaHref: '#inquiry:purchase',
      },
      {
        name: 'Enterprise',
        forWho: 'Many domains · org-wide standard',
        price: 'Custom',
        priceUnit: 'unlimited internal domains',
        priceSub: 'Enterprise wins when you run 7+ domains',
        feats: ['Unlimited internal domains', 'Wildcard (*.company.com) support', 'Priority technical support', 'OEM/redistribution by agreement'],
        cta: 'Contact sales',
        ctaHref: '#inquiry:enterprise',
      },
    ],
    includesHead: 'Included with every Pro license',
    includes: [
      'All 24 commercial packages — nothing sold separately',
      '17 enterprise chart types included (not an add-on)',
      'Unlimited developers, servers, CPU cores, and projects',
      '2 non-production (dev/stage) domains free + localhost always free',
      '30-day full-featured evaluation key',
      '45-day money-back guarantee',
      'React 18/19 + Vue 3 — one license covers both',
      'First year of support & updates included',
    ],
    faqHead: 'FAQ',
    faqs: [
      {
        q: 'What counts as a "domain"?',
        a: (
          <p>
            One production FQDN, e.g. <code>erp.company.com</code> = one license. We never count servers,
            CPU cores, projects, or developers. Two non-production (dev/staging) domains are included
            free, and <code>localhost</code> is always free. Running many subdomains? Ask about
            Enterprise with wildcard support.
          </p>
        ),
      },
      {
        q: 'Really no developer-seat limit?',
        a: (
          <p>
            Really. Most enterprise grids charge per developer seat per year; topgrid charges per deployed
            domain. A team of 3 or 30 pays the same.
          </p>
        ),
      },
      {
        q: 'How do I apply the license?',
        a: (
          <p>
            Register your key once at app entry with <code>setLicenseKey('...')</code>. Verification runs
            at runtime (in the browser) and never touches your build/deploy pipeline. Nuxt/Next SSR & SSG
            safe.
          </p>
        ),
      },
      {
        q: 'What happens without a key?',
        a: (
          <p>
            Pro components show a small watermark — but everything keeps working. Try it freely first; an
            evaluation key removes the watermark for 30 days.
          </p>
        ),
      },
      {
        q: 'What does renewal include?',
        a: (
          <p>
            Subscriptions renew at the same price and include all updates and support. Perpetual licenses
            (3× annual) include the first year; afterwards optional maintenance keeps updates and support
            flowing — or keep using your version forever.
          </p>
        ),
      },
      {
        q: 'Where is the line between Community (free) and Pro?',
        a: (
          <p>
            The 7 core packages — grid, sorting, filtering, renderers, export, the Vue adapter — are MIT
            and free. Pivot, aggregation, server-side row models, charts, spreadsheet, change tracking,
            range selection and more make up the 24 Pro packages. See{' '}
            <Link to="/architecture">Architecture</Link> for the full layout.
          </p>
        ),
      },
    ],
    bottomHead: '30 days is enough — evaluate every feature yourself.',
    bottomCta: 'Request a 30-day evaluation key →',
    bottomHref: TRIAL_EN,
    form: {
      head: 'Contact us directly',
      sub: 'Send the form below and we reply within one business day. (Prefer email? Use the buttons above.)',
      company: 'Company / name',
      email: 'Email *',
      type: 'Inquiry type',
      types: { trial: '30-day evaluation key', purchase: 'Purchase quote', enterprise: 'Enterprise / OEM', other: 'Other' },
      domain: 'Target domain (optional)',
      message: 'Message',
      submit: 'Send inquiry',
      sending: 'Sending…',
      done: '✅ Received. We will reply by email within one business day.',
      errPrefix: 'Failed to send: ',
    },
  },
};

function InquiryForm({ t, initialType }: { t: Content; initialType: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [err, setErr] = useState('');
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    setStatus('sending');
    try {
      const r = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (j.ok) setStatus('done');
      else {
        setErr(String(j.err || ''));
        setStatus('error');
      }
    } catch {
      // 폼 백엔드 미가동/네트워크 실패 → mailto 폴백(내용 프리필)
      const subject = `[문의] topgrid — ${String(body.type || 'other')}`;
      const lines = `회사/성함: ${body.company || ''}\n이메일: ${body.email || ''}\n도메인: ${body.domain || ''}\n\n${body.message || ''}`;
      window.location.href = `mailto:sales@platree.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
      setStatus('idle');
    }
  }
  if (status === 'done') return <p className={styles.formDone}>{t.form.done}</p>;
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.formGrid}>
        <label>
          {t.form.company}
          <input name="company" maxLength={200} />
        </label>
        <label>
          {t.form.email}
          <input name="email" type="email" required maxLength={200} />
        </label>
        <label>
          {t.form.type}
          <select name="type" key={initialType} defaultValue={initialType}>
            <option value="trial">{t.form.types.trial}</option>
            <option value="purchase">{t.form.types.purchase}</option>
            <option value="enterprise">{t.form.types.enterprise}</option>
            <option value="other">{t.form.types.other}</option>
          </select>
        </label>
        <label>
          {t.form.domain}
          <input name="domain" maxLength={300} placeholder="erp.company.com" />
        </label>
      </div>
      <label className={styles.formMsg}>
        {t.form.message}
        <textarea name="message" rows={4} maxLength={5000} />
      </label>
      {/* honeypot — 사람은 안 보임 */}
      <input name="website" tabIndex={-1} autoComplete="off" className={styles.hp} aria-hidden="true" />
      {status === 'error' ? <p className={styles.formErr}>{t.form.errPrefix}{err}</p> : null}
      <button className="button button--primary" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? t.form.sending : t.form.submit}
      </button>
    </form>
  );
}

export default function Pricing() {
  const { i18n } = useDocusaurusContext();
  const t = CONTENT[i18n.currentLocale] ?? CONTENT.ko;
  const [formType, setFormType] = useState('trial');

  // 카드 CTA 클릭 → 하단 문의 폼으로 스크롤 + 유형 자동 선택(메일 앱 창 없음).
  function goToForm(e: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith('#inquiry:')) return; // getting-started 등은 정상 링크
    e.preventDefault();
    setFormType(href.split(':')[1] || 'purchase');
    const el = document.getElementById('inquiry');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const email = el.querySelector('input[name="email"]') as HTMLInputElement | null;
      setTimeout(() => email?.focus(), 500);
    }
  }
  return (
    <Layout title={t.title} description={t.subtitle}>
      <main className={styles.wrap}>
        <div className={styles.head}>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className={styles.promo}>{t.promo}</div>

        <div className={styles.tiers}>
          {t.tiers.map((tier) => (
            <div key={tier.name} className={`${styles.tier} ${tier.hot ? styles.tierHot : ''}`}>
              {tier.hot ? <span className={styles.hotBadge}>{tier.hotLabel}</span> : null}
              <div className={styles.tierName}>{tier.name}</div>
              <div className={styles.tierFor}>{tier.forWho}</div>
              <div className={styles.price}>
                {tier.price}
                <span className={styles.priceUnit}>{tier.priceUnit}</span>
              </div>
              <div className={styles.priceSub}>{tier.priceSub}</div>
              <ul className={styles.feats}>
                {tier.feats.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className={styles.tierCta}>
                {tier.ctaHref.startsWith('#inquiry:') ? (
                  <a
                    className={`button ${tier.hot ? 'button--primary' : 'button--secondary'} button--block`}
                    href={tier.ctaHref}
                    onClick={(e) => goToForm(e, tier.ctaHref)}
                  >
                    {tier.cta}
                  </a>
                ) : (
                  <Link
                    className={`button ${tier.hot ? 'button--primary' : 'button--secondary'} button--block`}
                    href={tier.ctaHref.startsWith('mailto:') ? tier.ctaHref : undefined}
                    to={tier.ctaHref.startsWith('mailto:') ? undefined : tier.ctaHref}
                  >
                    {tier.cta}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.includes}>
          <h3>{t.includesHead}</h3>
          <div className={styles.includesGrid}>
            {t.includes.map((i) => (
              <div key={i}>{i}</div>
            ))}
          </div>
        </div>

        <div className={styles.faq}>
          <h2>{t.faqHead}</h2>
          {t.faqs.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              {f.a}
            </details>
          ))}
        </div>

        <div className={styles.formSection} id="inquiry">
          <h2>{t.form.head}</h2>
          <p className={styles.formSub}>{t.form.sub}</p>
          <InquiryForm t={t} initialType={formType} />
        </div>

        <div className={styles.bottomCta}>
          <p>{t.bottomHead}</p>
          <Link className="button button--primary button--lg" href={t.bottomHref}>
            {t.bottomCta}
          </Link>
        </div>
      </main>
    </Layout>
  );
}
