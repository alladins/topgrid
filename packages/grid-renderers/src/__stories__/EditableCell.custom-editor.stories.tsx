/**
 * EditableCell — custom editor slot (MOD-GRID-51, Track 2 제품결정 2번째).
 *
 * ★behavior-gated, non-vacuous (advisor): "a custom element rendered" is vacuous — a raw
 * TanStack `cell` renderer can already render anything. The real claim is that the SLOT
 * delivers the edit lifecycle the consumer would otherwise wire by hand:
 *   1) start in VIEW mode → click → custom editor AUTO-FOCUSES (a bare <input> doesn't
 *      self-focus → proves ctx.focusRef).
 *   2) type + Enter (while focused) → commit (NOT blur) → view shows the new value.
 *   3) type + Esc → cancel → revert, no commit.
 * The story deliberately wires NONE of focus / Enter / Esc / blur — only ctx.onChange and
 * ctx.focusRef. The custom editor is structurally distinct (data-testid, no built-in
 * `border-blue-400` class) so the test can tell slot-rendered from built-in-rendered.
 */
import { useState } from 'react';
import { EditableCell } from '../EditableCell.js';

function CustomEditorDemo() {
  const [value, setValue] = useState('initial');
  const [editing, setEditing] = useState(false);

  return (
    <div style={{ width: 260, padding: 16 }} data-testid="cell">
      <EditableCell
        value={value}
        editType="text"
        isEditing={editing}
        onStartEdit={() => setEditing(true)}
        onCommit={(v) => {
          setValue(v);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
        renderEditor={(ctx) => (
          // Plain, unstyled input — NO built-in border-blue-400 class, and the story wires
          // NONE of focus/Enter/Esc/blur. Everything but onChange/focusRef comes from the slot.
          <input
            data-testid="custom-editor"
            style={{ width: '100%', padding: 4, border: '1px dashed #888' }}
            value={ctx.value}
            onChange={(e) => ctx.onChange(e.target.value)}
            ref={ctx.focusRef}
          />
        )}
      />
    </div>
  );
}

const meta = {
  title: 'Cells/EditableCell (Custom Editor Slot)',
  parameters: { layout: 'centered' },
} as const;

export default meta;

/** Custom editor slot — view↔edit with consumer-supplied editor, lifecycle from the slot. */
export const Default = {
  render: () => <CustomEditorDemo />,
} as const;
