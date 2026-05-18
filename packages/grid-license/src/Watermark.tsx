// Watermark.tsx
import React from 'react';

interface WatermarkProps {
  required: boolean;
}

/**
 * Pro 라이선스가 없을 때 그리드 위에 표시되는 워터마크 컴포넌트.
 *
 * `required=false` 이면 `null` 반환 (렌더링 없음).
 */
export function Watermark({ required }: WatermarkProps): React.ReactElement | null {
  if (!required) return null;
  return (
    <div className="absolute top-0 right-0 opacity-40 pointer-events-none select-none text-sm font-semibold text-gray-500 p-2">
      Unlicensed @topgrid/grid
    </div>
  );
}
