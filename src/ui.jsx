import React, { useState } from 'react';
import { GripVertical, ChevronDown, ChevronRight, X, Search } from 'lucide-react';
import { COLORS } from './theme';

// Preset swatches for freeform tags (sage, amber, clay, teal, blue, purple, pink, gray).
export const TAG_COLORS = ['#7FA98C', '#D9A441', '#C1613F', '#5B9AA0', '#6B8CAE', '#9B7EBD', '#C97BA5', '#8C8F94'];

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
      .mention-editor { min-height: 160px; white-space: pre-wrap; overflow-wrap: break-word; }
      .mention-editor:empty::before { content: attr(data-placeholder); color: ${COLORS.inkFaint}; }
    `}</style>
  );
}

// Client-side text filter above a list -- no server-side search needed at
// personal-data scale.
export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div style={{ position: 'relative', marginBottom: 10 }}>
      <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: COLORS.inkFaint, pointerEvents: 'none' }} />
      <input
        className="cm-input"
        style={{ paddingLeft: 30, paddingRight: value ? 30 : 10 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          title="Clear search"
          style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: COLORS.inkFaint, padding: 4, display: 'flex' }}
        >
          <X size={13} />
        </button>
      )}
    </div>
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

// A labeled, collapsible group of fields within a longer edit form.
// Open by default; the toggle state is local to this form instance.
export function CollapsibleSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5, width: '100%', background: 'none', border: 'none',
          padding: '2px 0 6px', color: COLORS.inkDim, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', textAlign: 'left',
        }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
      </button>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>{children}</div>}
    </div>
  );
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

// Read-only compact tag pills for a row summary.
export function TagPills({ tags = [] }) {
  if (tags.length === 0) return null;
  return (
    <>
      {tags.map((t, i) => (
        <span
          key={i}
          style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
            background: `${t.color}26`, border: `1px solid ${t.color}`, color: t.color,
          }}
        >
          {t.label}
        </span>
      ))}
    </>
  );
}

// Freeform tag editor: type a label, pick a preset color, add. Each item's
// tags are its own independent list -- no shared/reusable tag registry.
export function TagsEditor({ tags = [], onChange }) {
  const [draftLabel, setDraftLabel] = useState('');
  const [draftColor, setDraftColor] = useState(TAG_COLORS[0]);

  const addTag = () => {
    const label = draftLabel.trim();
    if (!label) return;
    onChange([...tags, { label, color: draftColor }]);
    setDraftLabel('');
  };

  const removeTag = (i) => onChange(tags.filter((_, idx) => idx !== i));

  return (
    <Field label="Tags">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tags.map((t, i) => (
              <span
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '3px 5px 3px 10px', borderRadius: 999,
                  background: `${t.color}26`, border: `1px solid ${t.color}`, color: t.color, fontSize: 12, fontWeight: 600,
                }}
              >
                {t.label}
                <button
                  type="button"
                  onClick={() => removeTag(i)}
                  style={{ background: 'none', border: 'none', color: t.color, padding: 2, display: 'flex' }}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="cm-input"
            style={{ flex: 1 }}
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder="New tag, e.g. Favorite, Daily, Oncology…"
          />
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {TAG_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setDraftColor(c)}
                title={c}
                style={{
                  width: 18, height: 18, borderRadius: '50%', background: c, padding: 0,
                  border: draftColor === c ? `2px solid ${COLORS.ink}` : '2px solid transparent',
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addTag}
            style={{ background: COLORS.accent, border: 'none', color: '#0E1416', fontSize: 12, fontWeight: 600, padding: '7px 12px', borderRadius: 6, flexShrink: 0 }}
          >
            Add
          </button>
        </div>
      </div>
    </Field>
  );
}

// A single accent color per row (e.g. "this is high importance"), separate
// from the freeform multi-tag system -- shown as a stripe on the row itself
// via rowColorStyle rather than a labeled pill.
export function ColorPicker({ value, onChange, label = 'Row color' }) {
  return (
    <Field label={label}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onChange('')}
          title="No color"
          style={{
            width: 20, height: 20, borderRadius: '50%', background: COLORS.bg, padding: 0,
            border: `2px solid ${value ? COLORS.line : COLORS.ink}`,
          }}
        />
        {TAG_COLORS.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => onChange(c)}
            title={c}
            style={{
              width: 20, height: 20, borderRadius: '50%', background: c, padding: 0,
              border: `2px solid ${value === c ? COLORS.ink : 'transparent'}`,
            }}
          />
        ))}
      </div>
    </Field>
  );
}

// Renders a row's chosen color as a thicker left edge; falls back to the
// normal border on all sides when no color is set.
export function rowColorStyle(color) {
  return {
    border: `1px solid ${COLORS.line}`,
    borderLeft: `3px solid ${color || COLORS.line}`,
  };
}
