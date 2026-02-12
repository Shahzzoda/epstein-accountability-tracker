'use client';

import { useState } from 'react';

export default function CopyLinkButton() {
  const [status, setStatus] = useState('');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus('Copied');
    } catch {
      setStatus('Unable to copy');
    } finally {
      setTimeout(() => setStatus(''), 1600);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
      >
        Copy link
      </button>
      {status && <span className="text-xs font-semibold text-slate-600">{status}</span>}
    </div>
  );
}
