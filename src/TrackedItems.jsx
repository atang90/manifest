import React, { useEffect, useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import { COLORS } from './theme';
import { Field, Row2, useDragReorder, persistOrder, DragHandle } from './ui';

const BLANK = { category: '', item_name: '', details: [], notes: '' };

export default function TrackedItems({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null); // item id, or 'new'
  const [draft, setDraft] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('tracked_items')
        .select('*')
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (fetchError) setError(fetchError.message);
      else setItems(data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const startAdd = () => {
    setDraft(BLANK);
    setEditingId('new');
  };

  const startEdit = (it) => {
    setDraft({ category: it.category, item_name: it.item_name, details: it.details || [], notes: it.notes });
    setEditingId(it.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(BLANK);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (editingId === 'new') {
        const { data, error: insertError } = await supabase
          .from('tracked_items')
          .insert({ ...draft, user_id: session.user.id, sort_order: items.length })
          .select()
          .single();
        if (insertError) throw insertError;
        setItems((prev) => [...prev, data]);
      } else {
        const { data, error: updateError } = await supabase
          .from('tracked_items')
          .update(draft)
          .eq('id', editingId)
          .select()
          .single();
        if (updateError) throw updateError;
        setItems((prev) => prev.map((it) => (it.id === editingId ? data : it)));
      }
      cancelEdit();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    const prev = items;
    setItems((it) => it.filter((x) => x.id !== id));
    const { error: deleteError } = await supabase.from('tracked_items').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      setItems(prev);
    }
    if (editingId === id) cancelEdit();
  };

  const { handleDragStart, handleDragOver, handleDrop } = useDragReorder(
    items,
    setItems,
    (next) => persistOrder(supabase, 'tracked_items', next)
  );

  return (
    <div>
      {error && <p style={{ color: COLORS.clay, fontSize: 13, marginTop: 0 }}>{error}</p>}

      {loading ? (
        <p style={{ color: COLORS.inkDim, fontSize: 13 }}>Loading…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.length === 0 && editingId !== 'new' && (
            <p style={{ color: COLORS.inkFaint, fontSize: 13 }}>Nothing tracked yet.</p>
          )}
          {items.map((it, i) =>
            editingId === it.id ? (
              <TrackedItemForm
                key={it.id}
                draft={draft}
                setDraft={setDraft}
                onSave={save}
                onCancel={cancelEdit}
                onRemove={() => remove(it.id)}
                saving={saving}
              />
            ) : (
              <TrackedItemRow
                key={it.id}
                item={it}
                onEdit={() => startEdit(it)}
                onRemove={() => remove(it.id)}
                onDragStart={handleDragStart(i)}
                onDragOver={handleDragOver}
                onDrop={handleDrop(i)}
              />
            )
          )}
          {editingId === 'new' && (
            <TrackedItemForm
              draft={draft}
              setDraft={setDraft}
              onSave={save}
              onCancel={cancelEdit}
              saving={saving}
            />
          )}
        </div>
      )}

      {editingId === null && (
        <button
          onClick={startAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: `1px dashed ${COLORS.line}`, color: COLORS.inkDim, borderRadius: 8, padding: '11px 16px', fontSize: 13.5, width: '100%', justifyContent: 'center', marginTop: 14 }}
        >
          <Plus size={15} /> Add tracked item
        </button>
      )}
    </div>
  );
}

function TrackedItemRow({ item, onEdit, onRemove, onDragStart, onDragOver, onDrop }) {
  const filled = (item.details || []).filter((d) => d.label || d.value);
  return (
    <div
      className="cm-row"
      onClick={onEdit}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ display: 'flex', alignItems: 'baseline', gap: 10, background: COLORS.panelRaised, border: `1px solid ${COLORS.line}`, borderRadius: 7, padding: '10px 12px', cursor: 'pointer', flexWrap: 'wrap' }}
    >
      <DragHandle onDragStart={onDragStart} />
      {item.category && (
        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.category}</span>
      )}
      <span style={{ fontSize: 13.5, fontWeight: 550 }}>{item.item_name || 'Unnamed item'}</span>
      {filled.length > 0 && (
        <span style={{ fontSize: 12, color: COLORS.inkDim }}>
          {filled.map((d) => `${d.label}: ${d.value}`).join(' · ')}
        </span>
      )}
      <span style={{ flex: 1 }} />
      <button
        className="cm-del"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{ opacity: 0, transition: 'opacity .12s', background: 'none', border: 'none', color: COLORS.inkFaint, padding: 4 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function DetailsEditor({ details = [], onChange }) {
  const update = (i, patch) => onChange(details.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const add = () => onChange([...details, { label: '', value: '' }]);
  const remove = (i) => onChange(details.filter((_, idx) => idx !== i));
  const { handleDragStart, handleDragOver, handleDrop } = useDragReorder(details, onChange, () => {});
  return (
    <Field label="Details">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {details.map((d, i) => (
          <div
            key={i}
            onDragOver={handleDragOver}
            onDrop={handleDrop(i)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <DragHandle onDragStart={handleDragStart(i)} />
            <input className="cm-input" style={{ flex: '0 0 110px' }} placeholder="Label (e.g. Dose)" value={d.label} onChange={(e) => update(i, { label: e.target.value })} />
            <input className="cm-input" placeholder="Value" value={d.value} onChange={(e) => update(i, { value: e.target.value })} />
            <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: COLORS.inkFaint, padding: 4 }}><X size={13} /></button>
          </div>
        ))}
        <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: COLORS.accent, fontSize: 12, padding: '2px 0', alignSelf: 'flex-start' }}>
          <Plus size={12} /> Add detail
        </button>
      </div>
    </Field>
  );
}

function TrackedItemForm({ draft, setDraft, onSave, onCancel, onRemove, saving }) {
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div style={{ background: COLORS.panelRaised, border: `1px solid ${COLORS.accent}`, borderRadius: 7, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Row2>
        <Field label="Category"><input className="cm-input" value={draft.category} onChange={set('category')} placeholder="Medications, Subscriptions, Supplies…" autoFocus /></Field>
        <Field label="Item name"><input className="cm-input" value={draft.item_name} onChange={set('item_name')} placeholder="Metformin, Netflix, Test strips…" /></Field>
      </Row2>

      <DetailsEditor details={draft.details} onChange={(details) => setDraft((d) => ({ ...d, details }))} />

      <Field label="Notes"><textarea className="cm-input" rows={2} value={draft.notes} onChange={set('notes')} placeholder="Anything else worth remembering…" /></Field>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        {onRemove ? (
          <button onClick={onRemove} style={{ background: 'none', border: 'none', color: COLORS.clay, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Trash2 size={13} /> Delete
          </button>
        ) : <span />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ background: 'none', border: `1px solid ${COLORS.line}`, color: COLORS.inkDim, fontSize: 12.5, fontWeight: 600, padding: '7px 14px', borderRadius: 6 }}>
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            style={{ background: COLORS.accent, border: 'none', color: '#0E1416', fontSize: 12.5, fontWeight: 600, padding: '7px 14px', borderRadius: 6, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
