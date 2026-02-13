import Link from 'next/link';

export default function TransparencyActPage() {
  return (
    <main className="startup-shell min-h-screen px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl leading-tight text-slate-900 sm:text-5xl">Epstein Files Transparency Act</h1>
          <p className="text-base leading-relaxed text-slate-700">
            This page summarizes what the law requires and when compliance actions are due.
          </p>
          <p className="text-sm text-slate-700">
            Official law page:{' '}
            <a
              href="https://www.congress.gov/bill/119th-congress/house-bill/4405"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--brand-blue)] underline underline-offset-2"
            >
              H.R. 4405 (119th Congress)
            </a>
          </p>
        </header>

        <hr className="border-[var(--border)]" />

        <section className="space-y-3">
          <h2 className="text-2xl text-slate-900">What the law requires</h2>
          <p className="text-sm leading-relaxed text-slate-700">
            The Act requires the Attorney General (through DOJ and FBI) to publicly release records related to Jeffrey Epstein
            and associates, unless records fall under specific legal exceptions (for example, active criminal investigations,
            victim-protection, or witness-safety protections).
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            For any withheld records, DOJ must report the withholding basis to Congress and preserve records under
            document-retention rules.
          </p>
        </section>

        <hr className="border-[var(--border)]" />

        <section className="space-y-4">
          <h2 className="text-2xl text-slate-900">Legislative timeline</h2>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">July 15, 2025</p>
            <p className="text-sm text-slate-700">H.R. 4405 introduced in the House.</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">November 18, 2025</p>
            <p className="text-sm text-slate-700">House considered and passed the bill.</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">November 19, 2025</p>
            <p className="text-sm text-slate-700">Signed into law (Public Law No: 119-18).</p>
          </div>
        </section>

        <hr className="border-[var(--border)]" />

        <section className="space-y-4">
          <h2 className="text-2xl text-slate-900">DOJ compliance timeline</h2>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Day 0: November 19, 2025</p>
            <p className="text-sm text-slate-700">Law takes effect.</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Day 30: December 19, 2025</p>
            <p className="text-sm text-slate-700">
              DOJ/FBI public release deadline for records required by the Act, subject to statutory withholding exceptions.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Day 45 if release completed on Day 30: January 3, 2026</p>
            <p className="text-sm text-slate-700">
              Deadline for DOJ to submit the post-release report to Congress (the statute sets this as 15 days after release completion).
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Ongoing requirement</p>
            <p className="text-sm text-slate-700">
              Records newly classified after July 1, 2025 must be reported in the Federal Register and sent to Congress.
            </p>
          </div>
        </section>

        <hr className="border-[var(--border)]" />

        <section className="space-y-2">
          <h2 className="text-2xl text-slate-900">Notes</h2>
          <p className="text-sm leading-relaxed text-slate-700">
            Compliance dates above are calculated from the enactment date and statutory intervals in Public Law 119-18.
            If DOJ completes release after Day 30, the congressional report deadline shifts to 15 days after the actual completion date.
          </p>
        </section>

        <div className="pt-2">
          <Link href="/" className="font-semibold text-[var(--brand-blue)] underline underline-offset-2">
            &larr; Back to district lookup
          </Link>
        </div>
      </div>
    </main>
  );
}
