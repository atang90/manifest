import React from 'react';
import { GripVertical } from 'lucide-react';
import { COLORS } from './theme';

export function GlobalStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      input, textarea, select { font-family: inherit; }
      input::placeholder, textarea::placeholder { color: ${COLORS.inkFaint}; }
      button { cursor: pointer; font-family: inherit; }
      .cm-input {
        background: ${COLORS.bg}; border: 1px solid ${COLORS.line}; color: ${COLORS.ink};
        border-radius: 6px; padding: 7px 10px; font-size: 13px; width: 100%;
      }
      .cm-input:focus { outline: none; border-color: ${COLORS.accent}; }
      .cm-row:hover .cm-del { opacity: 1; }
      .cm-chip {
        background: ${COLORS.bg}; border: 1px solid ${COLORS.line}; color: ${COLORS.inkDim};
        border-radius: 999px; padding: 5px 11px; font-size: 12px; font-weight: 600;
      }
      .cm-chip.active { background: rgba(91,154,160,0.15); border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
    `}</style>
  );
}

export function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: COLORS.inkDim }}>
      {label}
      {children}
    </label>
  );
}

export function Row2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{children}</div>;
}

// City / State / Zip: city gets the most room, state and zip are short.
export function RowCityStateZip({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>{children}</div>;
}

// Native HTML5 drag-and-drop reordering, driven by a grip handle on each row.
// `items`/`setItems` is the list's local state; `persist(next)` is called
// with the reordered array so the caller can save the new order.
export function useDragReorder(items, setItems, persist) {
  const dragIndex = React.useRef(null);

  const handleDragStart = (index) => () => { dragIndex.current = index; };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (index) => (e) => {
    e.preventDefault();
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === index) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    setItems(next);
    persist(next);
  };

  return { handleDragStart, handleDragOver, handleDrop };
}

export async function persistOrder(supabase, table, items) {
  await Promise.all(
    items.map((item, i) => (item.sort_order === i ? null : supabase.from(table).update({ sort_order: i }).eq('id', item.id)))
  );
}

export function DragHandle({ onDragStart }) {
  return (
    <span
      draggable
      onDragStart={onDragStart}
      onClick={(e) => e.stopPropagation()}
      title="Drag to reorder"
      style={{ cursor: 'grab', color: COLORS.inkFaint, display: 'flex', alignItems: 'center', flexShrink: 0 }}
    >
      <GripVertical size={14} />
    </span>
  );
}
