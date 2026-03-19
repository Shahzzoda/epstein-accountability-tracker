'use client';

import { useMemo, useState } from 'react';

interface ReportContactCardProps {
  officialName: string;
  officeLabel: string;
  phone?: string;
  website?: string;
  address?: string;
  contactForm?: string;
  messageAsk: string;
}

function EnvelopeIcon() {
  return (
    <svg className="h-4 w-4 text-slate-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2 .5v.38l6 3.75 6-3.75V5.5H4zM16 8.12l-5.47 3.42a1 1 0 01-1.06 0L4 8.12V15h12V8.12z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4 text-slate-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M2.9 2.9a1 1 0 011.05-.24l3 1a1 1 0 01.66.85l.2 2.2a1 1 0 01-.29.8L6.2 8.8a12.7 12.7 0 005 5l1.3-1.32a1 1 0 01.8-.29l2.2.2a1 1 0 01.85.66l1 3a1 1 0 01-.24 1.05l-1.35 1.35a2 2 0 01-2.03.48A17 17 0 012.42 4.93 2 2 0 012.9 2.9z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4 text-slate-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 2a6 6 0 00-6 6c0 4.5 6 10 6 10s6-5.5 6-10a6 6 0 00-6-6zm0 8.5A2.5 2.5 0 1110 5a2.5 2.5 0 010 5.5z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="h-4 w-4 text-slate-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm5.94 7h-2.02a12.4 12.4 0 00-1.1-4A6.02 6.02 0 0115.94 9zM10 4c.7.84 1.3 2.28 1.57 4H8.43C8.7 6.28 9.3 4.84 10 4zM7.18 5A12.4 12.4 0 006.08 9H4.06A6.02 6.02 0 017.18 5zM4.06 11h2.02a12.4 12.4 0 001.1 4A6.02 6.02 0 014.06 11zM10 16c-.7-.84-1.3-2.28-1.57-4h3.14c-.27 1.72-.87 3.16-1.57 4zm2.82-1c.48-1.07.84-2.46 1.1-4h2.02a6.02 6.02 0 01-3.12 4z" />
    </svg>
  );
}

function actionLink() {
  return 'text-xs font-semibold text-[var(--brand-blue)] underline underline-offset-2 hover:text-[#0d2f59]';
}

function ContactItem({
  icon,
  label,
  value,
  actions
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 py-1">
      <span className="flex h-5 items-center">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-start gap-1.5">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          {actions && <div className="flex items-center gap-1.5">{actions}</div>}
        </div>
        <div className="mt-0.5 min-w-0 text-sm text-slate-700">{value}</div>
      </div>
    </div>
  );
}

export default function ReportContactCard({
  officialName,
  officeLabel,
  phone,
  website,
  address,
  contactForm,
  messageAsk
}: ReportContactCardProps) {
  const [copyStatus, setCopyStatus] = useState('');
  const [name, setName] = useState('');
  const [cityZip, setCityZip] = useState('');

  const message = useMemo(() => {
    const intro = name ? `Hello, my name is ${name}.` : 'Hello, I am a constituent.';
    const location = cityZip ? `I live in ${cityZip}.` : '';

    return [
      intro,
      location,
      `I am contacting ${officeLabel} ${officialName} about Epstein-file disclosure actions.`,
      messageAsk,
      'Please send a written response with the exact steps you support and the timeline you expect.'
    ]
      .filter(Boolean)
      .join('\n');
  }, [name, cityZip, officeLabel, officialName, messageAsk]);

  const copyText = async (text: string, success: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(success);
    } catch {
      setCopyStatus('Unable to copy');
    } finally {
      setTimeout(() => setCopyStatus(''), 1400);
    }
  };

  return (
    <section className="space-y-3 pt-1">
      {contactForm && (
        <ContactItem
          icon={<EnvelopeIcon />}
          label="Contact form"
          value={<p className="break-all">{contactForm}</p>}
          actions={
            <>
              <button type="button" className={actionLink()} onClick={() => copyText(contactForm, 'Contact form link copied')}>Copy</button>
              <span className="text-slate-400">·</span>
              <a href={contactForm} target="_blank" rel="noopener noreferrer" className={actionLink()}>Open form</a>
            </>
          }
        />
      )}

      {phone && (
        <ContactItem
          icon={<PhoneIcon />}
          label="Phone"
          value={<p>{phone}</p>}
          actions={
            <>
              <button type="button" className={actionLink()} onClick={() => copyText(phone, 'Phone number copied')}>Copy</button>
              <span className="text-slate-400">·</span>
              <a href={`tel:${phone}`} className={actionLink()}>Call</a>
            </>
          }
        />
      )}

      {address && (
        <ContactItem
          icon={<PinIcon />}
          label="Office address"
          value={<p className="whitespace-pre-wrap">{address}</p>}
          actions={
            <>
              <button type="button" className={actionLink()} onClick={() => copyText(address, 'Address copied')}>Copy</button>
            </>
          }
        />
      )}

      {website && (
        <ContactItem
          icon={<GlobeIcon />}
          label="Official website"
          value={<p className="break-all">{website}</p>}
          actions={
            <>
              <button type="button" className={actionLink()} onClick={() => copyText(website, 'Website link copied')}>Copy</button>
              <span className="text-slate-400">·</span>
              <a href={website} target="_blank" rel="noopener noreferrer" className={actionLink()}>Visit</a>
            </>
          }
        />
      )}

      <details className="pt-1">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Need help finding the right words?</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            value={cityZip}
            onChange={(e) => setCityZip(e.target.value)}
            placeholder="City / ZIP (optional)"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <textarea
          value={message}
          readOnly
          rows={7}
          className="mt-3 w-full resize-y rounded-md border border-[var(--border)] px-3 py-2 text-xs leading-relaxed text-slate-700"
        />
        <button
          type="button"
          onClick={() => copyText(message, 'Message copied')}
          className="mt-2 text-xs font-semibold text-[var(--brand-blue)] underline underline-offset-2 hover:text-[#0d2f59]"
        >
          Copy message
        </button>
      </details>

      {copyStatus && <p className="text-xs font-semibold text-slate-600">{copyStatus}</p>}
    </section>
  );
}
