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
                        **Rep Finder** is a citizen-led transparency initiative. Its goal is to provide a clear,
                        accessible record of how elected officials have acted regarding the disclosure of the Epstein files.
                    </p>
                    <p>
                        We believe that transparency is accountability. By tracking votes, sponsorships, and public advocacy,
                        we aim to give constituents the information they need to understand where their representatives stand.
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
