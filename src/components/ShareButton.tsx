'use client';

import { useState } from 'react';

interface ShareButtonProps {
  label?: string;
  className?: string;
}

export default function ShareButton({ label = 'Copy link', className }: ShareButtonProps) {
  const [modalText, setModalText] = useState('');

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setModalText('Link copied');
    } catch {
      setModalText('Unable to copy link');
    }

    setTimeout(() => setModalText(''), 1600);
  };

  return (
    <>
      <button
        type="button"
        onClick={onCopy}
        className={className || "rounded-md bg-[var(--brand-blue)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0d2f59]"}
      >
        {label}
      </button>
      {modalText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4">
          <div className="w-full max-w-xs rounded-lg bg-white p-4 text-center shadow-xl">
            <p className="text-sm font-semibold text-slate-900">{modalText}</p>
          </div>
        </div>
      )}
    </>
  );
}
