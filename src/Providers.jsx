import React, { useEffect, useState } from 'react';
import { Plus, X, Phone, Printer, MapPin, Building2, Trash2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import { COLORS } from './theme';
import { Field, Row2 } from './ui';

const CREDENTIAL_OPTIONS = ['MD', 'DO', 'NP', 'PA', 'RN', 'DDS', 'DPM', 'PharmD', 'PhD', 'LCSW', 'Other'];

const BLANK = {
  first_name: '',
  last_name: '',
  credentials: [],
  specialty: '',
  hospital: '',
  address: '',
  role: '',
  phone: '',
  fax: '',
  notes: '',
};

export default function Providers({ session }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null); // provider id, or 'new'
  const [draft, setDraft] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: true });
      if (cancelled) return;
      if (fetchError) setError(fetchError.message);
      else setProviders(data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const startAdd = () => {
    setDraft(BLANK);
    setEditingId('new');
  };

  const startEdit = (p) => {
    setDraft({
      first_name: p.first_name,
      last_name: p.last_name,
      credentials: p.credentials || [],
      specialty: p.specialty,
      hospital: p.hospital,
      address: p.address,
      role: p.role,
      phone: p.phone,
      fax: p.fax,
      notes: p.notes,
    });
    setEditingId(p.id);
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
          .from('providers')
          .insert({ ...draft, user_id: session.user.id })
          .select()
          .single();
        if (insertError) throw insertError;
        setProviders((prev) => [...prev, data]);
      } else {
        const { data, error: updateError } = await supabase
          .from('providers')
          .update(draft)
          .eq('id', editingId)
          .select()
          .single();
        if (updateError) throw updateError;
        setProviders((prev) => prev.map((p) => (p.id === editingId ? data : p)));
      }
      cancelEdit();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    const prev = providers;
    setProviders((p) => p.filter((x) => x.id !== id));
    const { error: deleteError } = await supabase.from('providers').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      setProviders(prev);
    }
    if (editingId === id) cancelEdit();
  };

  return (
    <div>
      {error && <p style={{ color: COLORS.clay, fontSize: 13, marginTop: 0 }}>{error}</p>}

      {loading ? (
        <p style={{ color: COLORS.inkDim, fontSize: 13 }}>Loading…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {providers.length === 0 && editingId !== 'new' && (
            <p style={{ color: COLORS.inkFaint, fontSize: 13 }}>No contacts yet.</p>
          )}
          {providers.map((p) =>
            editingId === p.id ? (
              <ProviderForm
                key={p.id}
                draft={draft}
                setDraft={setDraft}
                onSave={save}
                onCancel={cancelEdit}
                onRemove={() => remove(p.id)}
                saving={saving}
              />
            ) : (
              <ProviderRow key={p.id} provider={p} onEdit={() => startEdit(p)} onRemove={() => remove(p.id)} />
            )
          )}
          {editingId === 'new' && (
            <ProviderForm
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
          <Plus size={15} /> Add contact
        </button>
      )}
    </div>
  );
}

function fullName(provider) {
  const name = [provider.first_name, provider.last_name].filter(Boolean).join(' ');
  const creds = (provider.credentials || []).join(', ');
  return { name: name || 'Unnamed', creds };
}

function ProviderRow({ provider, onEdit, onRemove }) {
  const { name, creds } = fullName(provider);
  return (
    <div
      className="cm-row"
      onClick={onEdit}
      style={{ display: 'flex', alignItems: 'baseline', gap: 10, background: COLORS.panelRaised, border: `1px solid ${COLORS.line}`, borderRadius: 7, padding: '10px 12px', cursor: 'pointer', flexWrap: 'wrap' }}
    >
      <span style={{ fontSize: 13.5, fontWeight: 550 }}>
        {name}{creds && <span style={{ color: COLORS.inkDim, fontWeight: 500 }}>, {creds}</span>}
      </span>
      {provider.role && (
        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{provider.role}</span>
      )}
      {provider.specialty && <span style={{ fontSize: 12, color: COLORS.inkDim }}>{provider.specialty}</span>}
      {provider.hospital && (
        <span style={{ fontSize: 11.5, color: COLORS.inkFaint, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Building2 size={10} /> {provider.hospital}
        </span>
      )}
      {provider.address && (
        <span style={{ fontSize: 11.5, color: COLORS.inkFaint, display: 'flex', alignItems: 'center', gap: 3 }}>
          <MapPin size={10} /> {provider.address}
        </span>
      )}
      <span style={{ flex: 1 }} />
      {provider.phone && (
        <span style={{ fontSize: 12, color: COLORS.inkDim, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Phone size={11} /> {provider.phone}
        </span>
      )}
      {provider.fax && (
        <span style={{ fontSize: 12, color: COLORS.inkDim, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Printer size={11} /> {provider.fax}
        </span>
      )}
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

function CredentialsSelect({ value = [], onChange }) {
  const toggle = (cred) => {
    onChange(value.includes(cred) ? value.filter((c) => c !== cred) : [...value, cred]);
  };
  return (
    <Field label="Credentials">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {CREDENTIAL_OPTIONS.map((cred) => (
          <button
            type="button"
            key={cred}
            className={`cm-chip${value.includes(cred) ? ' active' : ''}`}
            onClick={() => toggle(cred)}
          >
            {cred}
          </button>
        ))}
      </div>
    </Field>
  );
}

function ProviderForm({ draft, setDraft, onSave, onCancel, onRemove, saving }) {
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div style={{ background: COLORS.panelRaised, border: `1px solid ${COLORS.accent}`, borderRadius: 7, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Row2>
        <Field label="First name"><input className="cm-input" value={draft.first_name} onChange={set('first_name')} placeholder="Jane" autoFocus /></Field>
        <Field label="Last name"><input className="cm-input" value={draft.last_name} onChange={set('last_name')} placeholder="Smith" /></Field>
      </Row2>

      <CredentialsSelect value={draft.credentials} onChange={(credentials) => setDraft((d) => ({ ...d, credentials }))} />

      <Row2>
        <Field label="Specialty"><input className="cm-input" value={draft.specialty} onChange={set('specialty')} placeholder="Oncologist, Primary care…" /></Field>
        <Field label="Hospital / practice"><input className="cm-input" value={draft.hospital} onChange={set('hospital')} placeholder="Who they work for" /></Field>
      </Row2>
      <Row2>
        <Field label="Address"><input className="cm-input" value={draft.address} onChange={set('address')} placeholder="Street address" /></Field>
        <Field label="Role"><input className="cm-input" value={draft.role} onChange={set('role')} placeholder="Primary, Secondary…" /></Field>
      </Row2>
      <Row2>
        <Field label="Phone"><input className="cm-input" value={draft.phone} onChange={set('phone')} placeholder="(000) 000-0000" /></Field>
        <Field label="Fax"><input className="cm-input" value={draft.fax} onChange={set('fax')} placeholder="(000) 000-0000" /></Field>
      </Row2>
      <Field label="Notes"><textarea className="cm-input" rows={2} value={draft.notes} onChange={set('notes')} placeholder="Office hours, portal login, etc." /></Field>

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

