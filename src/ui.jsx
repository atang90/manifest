import React from 'react';
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
