import Link from 'next/link';

export default function AboutPage() {
    return (
        <main className="min-h-screen px-6 py-12 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-8">
                <header className="border-b border-[var(--border)] pb-6">
                    <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">About Rep Finder</h1>
                </header>

                <section className="space-y-4 text-base leading-relaxed text-slate-700">
                    <p>
                        <strong>Rep Finder</strong> exists for one reason: accountability should not be optional.
                        Power without scrutiny becomes secrecy, and secrecy protects systems that hurt people.
                        This project gives constituents a direct, public way to ask a simple question of every lawmaker:
                        What did you do when transparency was on the table?
                    </p>
                    <p>
                        The Epstein story did not appear overnight. It has been publicly reported in phases since
                        <strong> 1996</strong>, with years of allegations, investigations, civil filings, plea deals,
                        witness reporting, media coverage, and official records accumulating into a long public trail.
                        By the time the broader public focus intensified in the late 2010s and early 2020s,
                        the core question was no longer whether there was a record. The question was whether leaders
                        would confront it in daylight.
                    </p>
                    <p>
                        Rep Finder tracks that daylight: recorded votes, bill sponsorships and cosponsorships,
                        petition signatures, and other verifiable public actions tied to disclosure.
                        This is not about rumor. It is about receipts.
                    </p>
                    <p>
                        Accountability is not revenge. Accountability is civic maintenance.
                        It is how a democracy remembers what happened, who acted, and who looked away.
                        If constituents stop asking, institutions stop answering.
                    </p>
                </section>

                <section className="rounded-xl border border-[var(--border)] bg-slate-50 p-6">
                    <h2 className="text-xl font-semibold text-slate-900">Credits</h2>
                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                        <li>
                            <span className="font-semibold">Built by:</span>{' '}
                            <a href="https://x.com/zodattack" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-blue)] hover:underline">
                                @zodattack
                            </a>{' '}
                            and contributors.
                        </li>
                        <li>
                            <span className="font-semibold">Open Source:</span>{' '}
                            <a href="https://github.com/your-repo/rep-finder" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-blue)] hover:underline">
                                View code on GitHub
                            </a>
                        </li>
                        <li>
                            <span className="font-semibold">Data Sources:</span>{' '}
                            <Link href="/epstein-files" className="text-[var(--brand-blue)] hover:underline">
                                See Methodology
                            </Link>
                        </li>
                    </ul>
                </section>

                <div className="pt-8">
                    <Link href="/" className="font-semibold text-[var(--brand-blue)] hover:underline">
                        &larr; Back to district lookup
                    </Link>
                </div>
            </div>
        </main>
    );
}
