import { useState, type JSX, type ReactNode } from 'react';
import { useLicenseStatus, Watermark } from '@topgrid/grid-license';

/**
 * MOD-GRID-58 — SideBar: a unified tool-panel container (accordion).
 *
 * XX Grid `sideBar` 대응: 여러 도구 패널(컬럼 ToolPanel, 필터 패널 등)을 하나의 아코디언 컨테이너로
 * 묶어 헤더 클릭으로 한 번에 하나의 패널만 펼친다. 패널 자체는 소비자가 `content` 로 주입하므로
 * SideBar 는 그리드 상태를 모른다(ToolPanel 과 동일한 callback-only 철학).
 */

/** One panel section in a {@link SideBar}. */
export interface SideBarPanelDef {
  /** Stable panel id. */
  id: string;
  /** Header label. */
  title: string;
  /** Panel body (e.g. a ToolPanel). */
  content: ReactNode;
}

/** Props for {@link SideBar}. */
export interface SideBarProps {
  /** Panels rendered as accordion sections, in order. */
  panels: SideBarPanelDef[];
  /** Initially open panel id (default: the first panel). */
  defaultOpenId?: string;
  /** Additional className appended to the root container. */
  className?: string;
}

/**
 * SideBar — accordion container for tool panels. One section open at a time; clicking an open
 * section's header collapses it. Pro watermark composited when unlicensed (root is `relative`).
 */
export function SideBar({ panels, defaultOpenId, className }: SideBarProps): JSX.Element {
  const lic = useLicenseStatus();
  const [openId, setOpenId] = useState<string | null>(
    defaultOpenId ?? panels[0]?.id ?? null,
  );
  const rootComposed = ['relative', 'border', 'rounded', 'inline-block', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootComposed} data-sidebar="">
      {panels.map((panel) => {
        const open = panel.id === openId;
        return (
          <div key={panel.id} data-sidebar-panel={panel.id}>
            <button
              type="button"
              data-sidebar-toggle={panel.id}
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : panel.id)}
              className="w-full text-left px-3 py-2 font-medium border-b cursor-pointer bg-gray-50"
            >
              {open ? '▼' : '▶'} {panel.title}
            </button>
            {open && (
              <div data-sidebar-content={panel.id} className="p-2">
                {panel.content}
              </div>
            )}
          </div>
        );
      })}
      {lic.watermarkRequired && <Watermark required />}
    </div>
  );
}
