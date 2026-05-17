/**
 * @tomis/grid-features — FilterPopover 컴포넌트.
 *
 * MOD-GRID-09 G-001 AC-003:
 * 네이티브 div position:absolute 팝오버 구현 (@radix-ui 없음, D2).
 *
 * 필수 동작 (D4):
 * 1. 외부 클릭 해제 (mousedown on document)
 * 2. Escape 키 해제 + trigger 포커스 복귀
 * 3. open 시 첫 번째 input 포커스
 * 4. close 시 trigger 버튼 포커스 복귀
 * 5. z-index z-[50] — sticky header(z-[10], MOD-GRID-02)보다 높음 (D7)
 *
 * @remarks
 * `verbatimModuleSyntax: true` — import type 분리.
 * `exactOptionalPropertyTypes: true` — FilterPopoverProps align prop 전달 시
 * spread-skip 패턴 사용 (C-29, Section 4.6).
 * Tailwind className 전용 (C-5). style={{}} 없음.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { FilterPopoverProps } from './types';

/**
 * 텍스트 필터용 Popover 컨테이너.
 *
 * trigger prop으로 트리거 요소를 받고, children으로 팝오버 내용을 렌더.
 * open/close 상태를 내부적으로 관리 (외부 제어 불필요).
 *
 * @param props.trigger - 팝오버를 열/닫는 트리거 요소 (아이콘 버튼 등)
 * @param props.children - 팝오버 내부 콘텐츠 (TextFilter 내용)
 * @param props.align - 팝오버 정렬 방향. 'left'(기본) | 'right'
 */
export function FilterPopover({ trigger, children, align = 'left' }: FilterPopoverProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 → 닫기 (D4-1)
  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [open]);

  // Escape 키 → 닫기 + trigger 포커스 복귀 (D4-2, D4-4)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setOpen(false);
        // trigger 안의 버튼 요소에 포커스 복귀
        const btn = triggerRef.current?.querySelector<HTMLButtonElement>('button');
        btn?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // open 시 첫 번째 input에 포커스 (D4-3)
  useEffect(() => {
    if (!open) return;

    // 다음 microtask에서 DOM이 안정된 후 포커스
    const id = setTimeout(() => {
      const firstInput = contentRef.current?.querySelector<HTMLInputElement>('input, select');
      firstInput?.focus();
    }, 0);
    return () => clearTimeout(id);
  }, [open]);

  const handleToggle = useCallback((): void => {
    setOpen((prev) => !prev);
  }, []);

  // 팝오버 정렬 클래스 (D4-4, Section 4.1)
  const alignClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* 트리거 래퍼 — trigger ReactNode를 감싸 클릭 핸들링 */}
      <span
        ref={triggerRef}
        onClick={handleToggle}
        className="inline-flex"
        // 트리거 버튼에 포커스 복귀 시 span 내 button을 직접 타겟
      >
        {trigger}
      </span>

      {/* 팝오버 콘텐츠 (D4, D7) */}
      {open && (
        <div
          ref={contentRef}
          role="dialog"
          aria-label="텍스트 필터"
          aria-modal="false"
          className={`absolute top-full mt-1 ${alignClass} z-[50] min-w-[220px] overflow-hidden rounded border border-gray-200 bg-white shadow-lg`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
