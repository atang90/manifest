import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X, Trash2, Link2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import { COLORS } from './theme';
import { Field, ColorPicker, rowColorStyle, useDragReorder, persistOrder, DragHandle } from './ui';

const BLANK = { title: '', body: '', entry_date: '', color: '' };

// Mentions are stored inline in the body as @[Label](type:id).
// Rendering resolves each one against the live pool, falling back to the
// saved label (as plain text) if the linked record no longer exists.
const MENTION_RE = /@\[([^\]]+)\]\((contact|tracked):([0-9a-fA-F-]+)\)/g;

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function contactLabel(c) {
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unnamed';
}

function buildMentionPool(contacts, trackedItems) {
  return [
    ...contacts.map((c) => ({ type: 'contact', id: c.id, label: contactLabel(c), meta: c.specialty || 'Contact' })),
    ...trackedItems.map((t) => ({ type: 'tracked', id: t.id, label: t.item_name || 'Unnamed item', meta: t.category || 'Tracked item' })),
  ];
}

function parseBody(text, pool) {
  const parts = [];
  let lastIndex = 0;
  let match;
  MENTION_RE.lastIndex = 0;
  while ((match = MENTION_RE.exec(text))) {
    const [full, label, type, id] = match;
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const live = pool.find((p) => p.type === type && p.id === id);
    parts.push({ mention: true, label: live ? live.label : label, missing: !live, type, id });
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export default function Notes({ session }) {
  const [notes, setNotes] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [trackedItems, setTrackedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null); // note id, or 'new'
  const [draft, setDraft] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (fetchError) setError(fetchError.message);
      else setNotes(data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [contactsRes, trackedRes] = await Promise.all([
        supabase.from('providers').select('id, first_name, last_name, specialty'),
        supabase.from('tracked_items').select('id, item_name, category'),
      ]);
      if (cancelled) return;
      setContacts(contactsRes.data || []);
      setTrackedItems(trackedRes.data || []);
    })();
    return () => { cancelled = true; };
  }, []);

  const mentionPool = useMemo(() => buildMentionPool(contacts, trackedItems), [contacts, trackedItems]);

  const startAdd = () => {
    setDraft(BLANK);
    setEditingId('new');
  };

  const startEdit = (n) => {
    setDraft({ title: n.title, body: n.body, entry_date: n.entry_date || '', color: n.color || '' });
    setEditingId(n.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(BLANK);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...draft, entry_date: draft.entry_date || null };
      if (editingId === 'new') {
        const { data, error: insertError } = await supabase
          .from('notes')
          .insert({ ...payload, user_id: session.user.id, sort_order: notes.length })
          .select()
          .single();
        if (insertError) throw insertError;
        setNotes((prev) => [...prev, data]);
      } else {
        const { data, error: updateError } = await supabase
          .from('notes')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();
        if (updateError) throw updateError;
        setNotes((prev) => prev.map((n) => (n.id === editingId ? data : n)));
      }
      cancelEdit();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    const prev = notes;
    setNotes((n) => n.filter((x) => x.id !== id));
    const { error: deleteError } = await supabase.from('notes').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      setNotes(prev);
    }
    if (editingId === id) cancelEdit();
  };

  const { handleDragStart, handleDragOver, handleDrop } = useDragReorder(
    notes,
    setNotes,
    (next) => persistOrder(supabase, 'notes', next)
  );

  return (
    <div>
      {error && <p style={{ color: COLORS.clay, fontSize: 13, marginTop: 0 }}>{error}</p>}

      {loading ? (
        <p style={{ color: COLORS.inkDim, fontSize: 13 }}>Loading…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.length === 0 && editingId !== 'new' && (
            <p style={{ color: COLORS.inkFaint, fontSize: 13 }}>No notes yet.</p>
          )}
          {editingId === 'new' && (
            <NoteForm draft={draft} setDraft={setDraft} onSave={save} onCancel={cancelEdit} saving={saving} mentionPool={mentionPool} />
          )}
          {notes.map((n, i) =>
            editingId === n.id ? (
              <NoteForm
                key={n.id}
                draft={draft}
                setDraft={setDraft}
                onSave={save}
                onCancel={cancelEdit}
                onRemove={() => remove(n.id)}
                saving={saving}
                mentionPool={mentionPool}
              />
            ) : (
              <NoteRow
                key={n.id}
                note={n}
                mentionPool={mentionPool}
                onEdit={() => startEdit(n)}
                onRemove={() => remove(n.id)}
                onDragStart={handleDragStart(i)}
                onDragOver={handleDragOver}
                onDrop={handleDrop(i)}
              />
            )
          )}
        </div>
      )}

      {editingId === null && (
        <button
          onClick={startAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: `1px dashed ${COLORS.line}`, color: COLORS.inkDim, borderRadius: 8, padding: '11px 16px', fontSize: 13.5, width: '100%', justifyContent: 'center', marginTop: 14 }}
        >
          <Plus size={15} /> Add note
        </button>
      )}
    </div>
  );
}

function NoteRow({ note, mentionPool, onEdit, onRemove, onDragStart, onDragOver, onDrop }) {
  const previewText = (note.body || '').replace(/\s+/g, ' ').trim();
  const parts = useMemo(() => (previewText ? parseBody(previewText, mentionPool) : []), [previewText, mentionPool]);
  return (
    <div
      className="cm-row"
      onClick={onEdit}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ background: COLORS.panelRaised, ...rowColorStyle(note.color), borderRadius: 7, padding: '10px 12px', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <DragHandle onDragStart={onDragStart} />
        <span style={{ fontSize: 13.5, fontWeight: 550, flex: 1, minWidth: 0 }}>{note.title || 'Untitled'}</span>
        {note.entry_date && (
          <span style={{ fontSize: 12, color: COLORS.inkDim, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{formatDate(note.entry_date)}</span>
        )}
        <button
          className="cm-del"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ opacity: 0, transition: 'opacity .12s', background: 'none', border: 'none', color: COLORS.inkFaint, padding: 4, flexShrink: 0 }}
        >
          <X size={14} />
        </button>
      </div>
      {previewText && (
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: COLORS.inkDim, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {parts.map((p, i) =>
            typeof p === 'string' ? (
              <React.Fragment key={i}>{p}</React.Fragment>
            ) : (
              <span key={i} style={{ color: p.missing ? COLORS.inkFaint : COLORS.accent, fontWeight: 600 }}>
                {p.label}
              </span>
            )
          )}
        </p>
      )}
    </div>
  );
}

function makeChipNode(mention) {
  const span = document.createElement('span');
  span.contentEditable = 'false';
  span.dataset.mentionType = mention.type;
  span.dataset.mentionId = mention.id;
  span.dataset.mentionLabel = mention.label;
  span.textContent = mention.label;
  const bg = mention.missing ? 'rgba(93,110,117,0.15)' : 'rgba(91,154,160,0.15)';
  const fg = mention.missing ? COLORS.inkFaint : COLORS.accent;
  span.style.cssText = `padding:1px 6px;border-radius:4px;background:${bg};color:${fg};font-weight:600;white-space:nowrap;`;
  return span;
}

function isMentionNode(node) {
  return node.nodeType === Node.ELEMENT_NODE && node.dataset && node.dataset.mentionId;
}

// Reads the editor's DOM back into the same @[Label](type:id) plain-text
// format used elsewhere, so the database schema and NoteRow's preview
// rendering don't need to know this is a rich editor.
// Walks recursively and defensively -- browsers are inconsistent about
// whether a line break becomes a <br> or a wrapping <div>/<p>, so both are
// treated as a newline rather than relying on one specific structure.
function serializeEditor(root) {
  let out = '';
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent;
    } else if (isMentionNode(node)) {
      out += `@[${node.dataset.mentionLabel}](${node.dataset.mentionType}:${node.dataset.mentionId})`;
    } else if (node.nodeName === 'BR') {
      out += '\n';
    } else if (node.nodeName === 'DIV' || node.nodeName === 'P') {
      if (out && !out.endsWith('\n')) out += '\n';
      node.childNodes.forEach(walk);
    } else {
      node.childNodes.forEach(walk);
    }
  };
  root.childNodes.forEach(walk);
  return out;
}

function MentionEditor({ value, onChange, mentionPool }) {
  const editorRef = useRef(null);
  const [query, setQuery] = useState(null); // null = not currently mentioning
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
  const [highlighted, setHighlighted] = useState(0);
  const savedRangeRef = useRef(null);

  const matches = useMemo(() => {
    if (query === null) return [];
    const q = query.toLowerCase();
    return mentionPool.filter((m) => m.label.toLowerCase().includes(q)).slice(0, 6);
  }, [query, mentionPool]);
  const activeIndex = Math.min(highlighted, Math.max(matches.length - 1, 0));

  // Build the initial DOM once from the stored plain text. The editor is
  // uncontrolled after this -- re-rendering on every keystroke would wipe
  // out the caret position and any chips being interacted with. Cleared
  // first so this stays correct under React StrictMode's double-invoked
  // effects in dev (which would otherwise duplicate the content).
  useEffect(() => {
    const el = editorRef.current;
    el.innerHTML = '';
    const parts = value ? parseBody(value, mentionPool) : [];
    parts.forEach((p) => {
      el.appendChild(typeof p === 'string' ? document.createTextNode(p) : makeChipNode(p));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMentionQuery = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) { setQuery(null); return; }
    const range = sel.getRangeAt(0);
    if (!editorRef.current.contains(range.startContainer) || range.startContainer.nodeType !== Node.TEXT_NODE) {
      setQuery(null);
      return;
    }
    const textBeforeCaret = range.startContainer.textContent.slice(0, range.startOffset);
    const at = textBeforeCaret.lastIndexOf('@');
    if (at === -1 || /[\s\n]/.test(textBeforeCaret.slice(at + 1))) {
      setQuery(null);
      return;
    }
    setQuery(textBeforeCaret.slice(at + 1));
    setHighlighted(0);
    savedRangeRef.current = range.cloneRange();
    const rect = range.getBoundingClientRect();
    const containerRect = editorRef.current.getBoundingClientRect();
    setCaretPos({ top: rect.bottom - containerRect.top, left: rect.left - containerRect.left });
  };

  const handleInput = () => {
    onChange(serializeEditor(editorRef.current));
    updateMentionQuery();
  };

  const placeCaretAfter = (node) => {
    const sel = window.getSelection();
    const range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  // execCommand correctly handles caret restoration for plain-text
  // insertion (newlines, paste) -- manual Range math got the caret position
  // wrong in testing, so this is deliberately not hand-rolled like the
  // mention-chip insertion below, which needs custom DOM nodes anyway.
  // insertLineBreak (not insertText with an embedded \n) is what reliably
  // produces a <br> instead of Chrome wrapping a new paragraph in a <div>.
  const insertPlainText = (text) => {
    text.split('\n').forEach((line, i) => {
      if (i > 0) document.execCommand('insertLineBreak');
      if (line) document.execCommand('insertText', false, line);
    });
    onChange(serializeEditor(editorRef.current));
  };

  const insertMention = (m) => {
    const range = savedRangeRef.current;
    if (!range || range.startContainer.nodeType !== Node.TEXT_NODE) return;
    const node = range.startContainer;
    const text = node.textContent;
    const at = text.slice(0, range.startOffset).lastIndexOf('@');
    const before = text.slice(0, at);
    const after = text.slice(range.startOffset);

    const chip = makeChipNode({ label: m.label, type: m.type, id: m.id, missing: false });
    const spaceNode = document.createTextNode(' ');
    const beforeNode = document.createTextNode(before);
    const afterNode = document.createTextNode(after);
    const parent = node.parentNode;
    parent.insertBefore(beforeNode, node);
    parent.insertBefore(chip, node);
    parent.insertBefore(spaceNode, node);
    parent.insertBefore(afterNode, node);
    parent.removeChild(node);

    placeCaretAfter(spaceNode);
    setQuery(null);
    editorRef.current.focus();
    onChange(serializeEditor(editorRef.current));
  };

  const handleKeyDown = (e) => {
    if (query !== null && matches.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((i) => (i + 1) % matches.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((i) => (i - 1 + matches.length) % matches.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(matches[activeIndex]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setQuery(null); return; }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      insertPlainText('\n');
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    insertPlainText((e.clipboardData || window.clipboardData).getData('text/plain'));
  };

  const editorWidth = editorRef.current ? editorRef.current.clientWidth : 300;
  const dropdownLeft = Math.max(0, Math.min(caretPos.left, editorWidth - 220));

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => setTimeout(() => setQuery(null), 150)}
        data-placeholder="Write freely… type @ to link a contact or tracked item"
        className="cm-input mention-editor"
      />
      {query !== null && matches.length > 0 && (
        <div
          style={{
            position: 'absolute', top: caretPos.top + 4, left: dropdownLeft, minWidth: 200,
            background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 6,
            zIndex: 10, maxHeight: 170, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {matches.map((m, i) => (
            <button
              type="button"
              key={`${m.type}:${m.id}`}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => insertMention(m)}
              style={{
                display: 'flex', justifyContent: 'space-between', width: '100%', textAlign: 'left',
                padding: '7px 10px', border: 'none', fontSize: 13,
                background: i === activeIndex ? COLORS.panelRaised : 'none',
                color: COLORS.ink,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Link2 size={11} color={COLORS.accent} /> {m.label}</span>
              <span style={{ color: COLORS.inkFaint, fontSize: 11 }}>{m.meta}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteForm({ draft, setDraft, onSave, onCancel, onRemove, saving, mentionPool }) {
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div style={{ background: COLORS.panelRaised, border: `1px solid ${COLORS.accent}`, borderRadius: 7, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 8 }}>
        <Field label="Title"><input className="cm-input" value={draft.title} onChange={set('title')} placeholder="What's this about?" autoFocus /></Field>
        <Field label="Date (optional)"><input className="cm-input" type="date" value={draft.entry_date} onChange={set('entry_date')} /></Field>
      </div>
      <Field label="Notes">
        <MentionEditor value={draft.body} onChange={(body) => setDraft((d) => ({ ...d, body }))} mentionPool={mentionPool} />
      </Field>
      <ColorPicker value={draft.color} onChange={(color) => setDraft((d) => ({ ...d, color }))} />

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
