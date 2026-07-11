import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type CSSProperties,
} from 'react';
import type { Table } from '@tanstack/react-table';
import { useGridExport } from './useGridExport';
import { stripExt } from './stripExt';
import type { ExportScope } from '../types';

/** 버튼이 노출하는 내보내기 포맷 */
export type ExportFormat = 'xlsx' | 'csv' | 'pdf' | 'clipboard' | 'print';

export interface GridExportButtonProps<TData> {
  /** TanStack v8 Table 인스턴스 */
  table: Table<TData>;
  /**
   * 노출할 포맷. 1개면 단일 버튼, 2개 이상이면 드롭다운 메뉴.
   * @default ['xlsx']
   */
  formats?: ExportFormat[];
  /**
   * 내보낼 행 범위.
   * @default 'filtered'
   */
  scope?: ExportScope;
  /** 파일명(확장자 제외/포함 무관 — 포맷에 맞는 확장자로 자동 정규화) */
  fileName?: string;
  /** 컬럼별 Excel number-format (xlsx 에만 적용) */
  columnFormats?: Record<string, string>;
  /** 컬럼별 폭 (xlsx 에만 적용) */
  columnWidths?: Record<string, number>;
  /** 버튼 라벨(미지정 시 locale 기본 "다운로드"/"Download") */
  label?: string;
  /**
   * 라벨 언어.
   * @default 'ko'
   */
  locale?: 'ko' | 'en';
  /** 루트 요소 className (스타일 커스터마이즈용) */
  className?: string;
  /**
   * scope='all' 에서 이 행수를 초과하면 내보내기 전 확인창(메인 스레드 블로킹 경고).
   * @default 10000
   */
  largeRowThreshold?: number;
  /** 내보내기 완료 후 호출 */
  onExported?: (format: ExportFormat) => void;
}

const LABELS = {
  ko: {
    download: '다운로드',
    xlsx: 'Excel',
    csv: 'CSV',
    pdf: 'PDF',
    clipboard: '클립보드 복사',
    print: '인쇄',
    empty: '내보낼 데이터 없음',
  },
  en: {
    download: 'Download',
    xlsx: 'Excel',
    csv: 'CSV',
    pdf: 'PDF',
    clipboard: 'Copy',
    print: 'Print',
    empty: 'No data to export',
  },
} as const;

// CSS 시스템 색 — 라이트/다크 자동 대응(별도 CSS·Tailwind 불필요).
const btnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  font: 'inherit',
  fontSize: 14,
  lineHeight: 1.2,
  border: '1px solid ButtonBorder',
  borderRadius: 6,
  background: 'ButtonFace',
  color: 'ButtonText',
  cursor: 'pointer',
};

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: 4,
  minWidth: 160,
  padding: 4,
  background: 'Canvas',
  color: 'CanvasText',
  border: '1px solid ButtonBorder',
  borderRadius: 6,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  zIndex: 50,
  listStyle: 'none',
};

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1v9m0 0L4.5 6.5M8 10l3.5-3.5M2 13h12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 그리드에 붙이는 내보내기 컨트롤. formats 가 1개면 단일 버튼, 2개 이상이면 드롭다운 메뉴.
 * 빈 데이터면 자동 비활성화되고, 대용량(scope='all')이면 확인 후 진행한다.
 * 스타일은 CSS 시스템 색 기반 인라인이라 별도 CSS 설치 없이 라이트/다크에 대응한다.
 *
 * @example
 * <GridExportButton table={table} formats={['xlsx', 'csv', 'pdf']} fileName="주문목록" />
 */
export function GridExportButton<TData>({
  table,
  formats = ['xlsx'],
  scope = 'filtered',
  fileName,
  columnFormats,
  columnWidths,
  label,
  locale = 'ko',
  className,
  largeRowThreshold = 10000,
  onExported,
}: GridExportButtonProps<TData>) {
  const ex = useGridExport(table);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const t = LABELS[locale] ?? LABELS.ko;
  const base = stripExt(fileName);
  const empty = ex.isEmpty(scope);

  // 바깥 클릭 시 메뉴 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const run = useCallback(
    (fmt: ExportFormat) => {
      // 대용량 가드 — 파일 생성 포맷 + scope='all' 에서만
      if ((fmt === 'xlsx' || fmt === 'csv' || fmt === 'pdf') && scope === 'all') {
        const n = ex.rowCount('all');
        if (n > largeRowThreshold) {
          const msg =
            locale === 'en'
              ? `Exporting ${n.toLocaleString()} rows may freeze the page briefly. Continue?`
              : `${n.toLocaleString()}행을 내보냅니다. 잠시 멈출 수 있습니다. 계속할까요?`;
          if (!window.confirm(msg)) return;
        }
      }
      // exactOptionalPropertyTypes: undefined 키를 넣지 않도록 조건부 스프레드
      const fileNameOpt = base !== undefined ? { fileName: base } : {};
      switch (fmt) {
        case 'xlsx':
          ex.toExcel({
            scope,
            ...fileNameOpt,
            ...(columnFormats ? { columnFormats } : {}),
            ...(columnWidths ? { columnWidths } : {}),
          });
          break;
        case 'csv':
          ex.toCsv({ scope, ...fileNameOpt });
          break;
        case 'pdf':
          ex.toPdf({ scope, ...fileNameOpt });
          break;
        case 'clipboard':
          ex.copy({ scope });
          break;
        case 'print':
          ex.print({ scope });
          break;
      }
      setOpen(false);
      onExported?.(fmt);
    },
    [ex, scope, base, columnFormats, columnWidths, largeRowThreshold, locale, onExported],
  );

  // 단일 포맷 → 단일 버튼
  if (formats.length === 1) {
    const fmt = formats[0];
    return (
      <button
        type="button"
        className={className}
        style={btnStyle}
        disabled={empty}
        title={empty ? t.empty : undefined}
        aria-label={`${t.download} ${t[fmt]}`}
        onClick={() => run(fmt)}
      >
        <DownloadIcon />
        {label ?? t[fmt]}
      </button>
    );
  }

  // 다중 포맷 → 드롭다운
  return (
    <div ref={rootRef} className={className} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        style={btnStyle}
        disabled={empty}
        title={empty ? t.empty : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <DownloadIcon />
        {label ?? t.download}
        <span aria-hidden="true" style={{ fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <ul role="menu" style={menuStyle}>
          {formats.map((fmt, i) => (
            <li key={fmt} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => run(fmt)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(-1)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 10px',
                  font: 'inherit',
                  fontSize: 14,
                  border: 'none',
                  borderRadius: 4,
                  background: hovered === i ? 'Highlight' : 'transparent',
                  color: hovered === i ? 'HighlightText' : 'inherit',
                  cursor: 'pointer',
                }}
              >
                {t[fmt]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
