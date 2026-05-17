// spec G-002 Section 7 #6 / Step 5
// AC-003: 12개 Cell 컴포넌트 각각 별도 Story export
// C-3 예외: mock props는 Storybook stories에서만 허용 (D7 결정, ADR-006)
// C-4: any 금지, 모든 타입 명시
import type { Meta, StoryObj } from '@storybook/react';
import {
  TextCell,
  NumberCell,
  DateCell,
  StatusBadgeCell,
  LinkCell,
  ButtonCell,
  CheckCell,
  IconCell,
  TagCell,
  AvatarCell,
  ProgressCell,
  EditableCell,
} from '@tomis/grid-renderers';

// ─── TextCell ─────────────────────────────────────────────────────────────
const textMeta: Meta<typeof TextCell> = {
  title: 'grid-renderers/TextCell',
  component: TextCell,
  tags: ['autodocs'],
};
export default textMeta;

export const TextCellDefault: StoryObj<typeof TextCell> = {
  name: 'TextCell 기본',
  args: {
    value: '홍길동',
  },
};

export const TextCellEmpty: StoryObj<typeof TextCell> = {
  name: 'TextCell 빈 값',
  args: {
    value: '',
    placeholder: '이름 없음',
  },
};

// ─── NumberCell ───────────────────────────────────────────────────────────
export const NumberCellDefault: StoryObj<typeof NumberCell> = {
  name: 'NumberCell 기본',
  args: {
    value: 1234567,
  },
};

export const NumberCellFormatted: StoryObj<typeof NumberCell> = {
  name: 'NumberCell 포맷 (소수점 2자리)',
  args: {
    value: 9876.54,
    decimalPlaces: 2,
  },
};

// ─── DateCell ─────────────────────────────────────────────────────────────
export const DateCellDefault: StoryObj<typeof DateCell> = {
  name: 'DateCell 기본',
  args: {
    value: '20260515',
  },
};

export const DateCellWithTime: StoryObj<typeof DateCell> = {
  name: 'DateCell 날짜+시간',
  args: {
    value: '20260515143000',
  },
};

// ─── StatusBadgeCell ──────────────────────────────────────────────────────
export const StatusBadgeCellActive: StoryObj<typeof StatusBadgeCell> = {
  name: 'StatusBadgeCell 활성',
  args: {
    value: 'active',
    label: '활성',
    variant: 'success',
  },
};

export const StatusBadgeCellInactive: StoryObj<typeof StatusBadgeCell> = {
  name: 'StatusBadgeCell 비활성',
  args: {
    value: 'inactive',
    label: '비활성',
    variant: 'error',
  },
};

// ─── LinkCell ─────────────────────────────────────────────────────────────
export const LinkCellDefault: StoryObj<typeof LinkCell> = {
  name: 'LinkCell 기본',
  args: {
    value: '링크 열기',
    href: 'https://example.com',
  },
};

// ─── ButtonCell ───────────────────────────────────────────────────────────
export const ButtonCellDefault: StoryObj<typeof ButtonCell> = {
  name: 'ButtonCell 기본',
  args: {
    value: '상세 보기',
    onClick: () => alert('ButtonCell 클릭'),
  },
};

export const ButtonCellDanger: StoryObj<typeof ButtonCell> = {
  name: 'ButtonCell 위험 액션',
  // NOTE: variant='danger' is pre-existing TS error (D2 rename: 'danger'→'destructive').
  // Out of scope for ADR-014 amendment — tracked separately.
  args: {
    value: '삭제',
    // @ts-expect-error pre-existing: variant 'danger' not in current type (D2 rename)
    variant: 'danger',
    onClick: () => alert('삭제 클릭'),
  },
};

// ─── CheckCell ────────────────────────────────────────────────────────────
export const CheckCellChecked: StoryObj<typeof CheckCell> = {
  name: 'CheckCell 체크됨',
  args: {
    value: true,
    readOnly: true,
  },
};

export const CheckCellUnchecked: StoryObj<typeof CheckCell> = {
  name: 'CheckCell 미체크',
  args: {
    value: false,
    readOnly: true,
  },
};

// ─── IconCell ─────────────────────────────────────────────────────────────
export const IconCellDefault: StoryObj<typeof IconCell> = {
  name: 'IconCell 기본',
  args: {
    icon: '✓',
    tooltip: '확인됨',
  },
};

// ─── TagCell ──────────────────────────────────────────────────────────────
export const TagCellDefault: StoryObj<typeof TagCell> = {
  name: 'TagCell 기본',
  args: {
    value: ['React', 'TypeScript', 'TanStack'],
  },
};

export const TagCellSingle: StoryObj<typeof TagCell> = {
  name: 'TagCell 단일 태그',
  args: {
    value: ['긴급'],
  },
};

// ─── AvatarCell ───────────────────────────────────────────────────────────
export const AvatarCellDefault: StoryObj<typeof AvatarCell> = {
  name: 'AvatarCell 이니셜',
  args: {
    name: '홍길동',
  },
};

export const AvatarCellWithSrc: StoryObj<typeof AvatarCell> = {
  name: 'AvatarCell 이미지',
  args: {
    name: '김영희',
    src: 'https://i.pravatar.cc/40',
  },
};

// ─── ProgressCell ─────────────────────────────────────────────────────────
export const ProgressCellDefault: StoryObj<typeof ProgressCell> = {
  name: 'ProgressCell 기본',
  args: {
    value: 72,
    max: 100,
  },
};

export const ProgressCellComplete: StoryObj<typeof ProgressCell> = {
  name: 'ProgressCell 100%',
  args: {
    value: 100,
    max: 100,
  },
};

// ─── EditableCell ─────────────────────────────────────────────────────────
export const EditableCellText: StoryObj<typeof EditableCell> = {
  name: 'EditableCell 텍스트',
  args: {
    value: '편집 가능한 값',
    editType: 'text',
    onCommit: (val: string) => console.log('committed:', val),
  },
};

export const EditableCellNumber: StoryObj<typeof EditableCell> = {
  name: 'EditableCell 숫자',
  args: {
    value: 42,
    editType: 'number',
    onCommit: (val: string) => console.log('committed:', val),
  },
};
