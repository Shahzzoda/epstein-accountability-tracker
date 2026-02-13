import Link from 'next/link';

const LAST_UPDATED = 'February 12, 2026';
const METHOD_VERSION = 'v0.3';

export default function EpsteinFilesPage() {
  return (
    <main className="startup-shell min-h-screen px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="border-b border-[var(--border)] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Sources & Method</p>
          <h1 className="mt-2 text-4xl leading-tight text-slate-900 sm:text-5xl">How this tracker is built</h1>
          <p className="mt-3 max-w-4xl text-base leading-relaxed text-slate-700">
            Every lawmaker report is generated from two files: a public scoring rubric (weights + rules)
            and the underlying action log for that lawmaker.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
            <span><span className="font-semibold">Last updated:</span> {LAST_UPDATED}</span>
            <span className="text-slate-400">•</span>
            <span><span className="font-semibold">Method version:</span> {METHOD_VERSION}</span>
            <span className="text-slate-400">•</span>
            <span><span className="font-semibold">Correction policy:</span> prior values are retained in version history; deltas are documented in commits.</span>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="section-card rounded-xl p-6">
            <h2 className="text-xl text-slate-900">Exactly what we ingest</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><span className="font-semibold">Action log:</span> lawmaker-level disclosure actions from <code>/data/epstein_scores.json</code>.</li>
              <li><span className="font-semibold">Identity + office info:</span> current term, district, office, contact data from <code>/data/legislators/current_legislators.json</code>.</li>
              <li><span className="font-semibold">No hidden inputs:</span> no unnamed sources, no rumor feeds, no private datasets.</li>
            </ul>
          </article>

          <article className="section-card rounded-xl p-6">
            <h2 className="text-xl text-slate-900">Data model</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><span className="font-semibold">Recorded actions:</span> vote support flag, sponsorship, cosponsorship, discharge petition signature.</li>
              <li><span className="font-semibold">Context fields:</span> name, chamber, party, state/district, office contact links.</li>
              <li><span className="font-semibold">Output:</span> computed 0-5 score, status band, and human-readable notes.</li>
            </ul>
          </article>
        </section>

        <section className="section-card rounded-xl p-6">
          <h2 className="text-xl text-slate-900">Scoring rubric (public)</h2>
          <p className="mt-2 text-sm text-slate-700">Each lawmaker starts at 1.0, then weights are added or subtracted and clamped to 0-5.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-[var(--border)] text-slate-900">
                  <th className="py-2 pr-4 font-semibold">Rule</th>
                  <th className="py-2 pr-4 font-semibold">Weight</th>
                  <th className="py-2 font-semibold">Source field</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--border)]"><td className="py-2 pr-4">Supportive recorded vote</td><td className="py-2 pr-4">+1.7</td><td className="py-2"><code>epstein_transparency_act.signed == yes</code></td></tr>
                <tr className="border-b border-[var(--border)]"><td className="py-2 pr-4">Signed discharge petition</td><td className="py-2 pr-4">+1.2</td><td className="py-2"><code>epstein_transparency_act.discharge_petition.signed</code></td></tr>
                <tr className="border-b border-[var(--border)]"><td className="py-2 pr-4">Cosponsored disclosure bill</td><td className="py-2 pr-4">+0.8</td><td className="py-2"><code>epstein_transparency_act.cosponsored</code></td></tr>
                <tr className="border-b border-[var(--border)]"><td className="py-2 pr-4">Sponsored disclosure bill</td><td className="py-2 pr-4">+1.3</td><td className="py-2"><code>epstein_transparency_act.sponsored</code></td></tr>
                <tr><td className="py-2 pr-4">Recorded non-supportive vote</td><td className="py-2 pr-4">-0.8</td><td className="py-2"><code>epstein_transparency_act.signed == no</code></td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="section-card rounded-xl p-6">
          <h2 className="text-xl text-slate-900">Example profile (annotated)</h2>
          <p className="mt-2 text-sm text-slate-700">Example of how one lawmaker record becomes a report card.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-white p-4 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">Input fields</p>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">
                {`official_full: "Jane Doe"
party: "R"
epstein_transparency_act.signed: "yes"
epstein_transparency_act.cosponsored: true
epstein_transparency_act.discharge_petition.signed: false`}
              </pre>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-white p-4 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">Output calculation</p>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">
                {`base 1.0
+ vote support 1.7
+ cosponsor 0.8
= 3.5 final score
status: Supportive`}
              </pre>
            </div>
          </div>
        </section>

        <section className="section-card rounded-xl p-6">
          <h2 className="text-xl text-slate-900">Primary sources and field mapping</h2>
          <ul className="mt-3 space-y-3 text-sm text-slate-700">
            <li><a className="font-semibold text-[var(--brand-blue)] hover:underline" href="https://clerk.house.gov/Votes" target="_blank" rel="noopener noreferrer">U.S. House Clerk roll calls</a>: maps to vote support field in action logs.</li>
            <li><a className="font-semibold text-[var(--brand-blue)] hover:underline" href="https://www.senate.gov/legislative/LIS/roll_call_lists/roll_call_vote_cfm.cfm" target="_blank" rel="noopener noreferrer">U.S. Senate roll calls</a>: maps to Senate vote support field in action logs.</li>
            <li><a className="font-semibold text-[var(--brand-blue)] hover:underline" href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer">Congress.gov bill pages</a>: maps to sponsorship/cosponsorship fields.</li>
            <li><a className="font-semibold text-[var(--brand-blue)] hover:underline" href="https://clerk.house.gov/Discharge-Petitions" target="_blank" rel="noopener noreferrer">House discharge petition records</a>: maps to petition signature field and date.</li>
            <li><a className="font-semibold text-[var(--brand-blue)] hover:underline" href="https://www.congress.gov/congressional-record" target="_blank" rel="noopener noreferrer">Congressional Record</a>: used to validate date context around public floor action.</li>
            <li><a className="font-semibold text-[var(--brand-blue)] hover:underline" href="https://bioguide.congress.gov/" target="_blank" rel="noopener noreferrer">Biographical Directory / Bioguide</a>: maps identity keys used to join lawmaker records.</li>
            <li><a className="font-semibold text-[var(--brand-blue)] hover:underline" href="/data/epstein_scores.json" target="_blank" rel="noopener noreferrer">Published action log (local)</a>: file used directly for score computation.</li>
            <li><a className="font-semibold text-[var(--brand-blue)] hover:underline" href="/data/current_legislators.json" target="_blank" rel="noopener noreferrer">Current legislator file (local)</a>: file used directly for current office/contact context.</li>
          </ul>
        </section>

        <section className="section-card rounded-xl p-6">
          <h2 className="text-xl text-slate-900">Scope and limitations</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            We track legislative/public-record actions only. We do not make claims about criminal conduct,
            and we do not rely on rumors or unnamed sources.
          </p>
        </section>

        <div className="text-center">
          <Link href="/" className="font-semibold text-[var(--brand-blue)] hover:underline">
            &larr; Back to district lookup
          </Link>
        </div>
      </div>
    </main>
  );
}
