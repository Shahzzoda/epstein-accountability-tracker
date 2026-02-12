'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();
    const methodActive = pathname.startsWith('/epstein-files');
    const isHome = pathname === '/';
    const reportOrResults = pathname.startsWith('/report/') || pathname.startsWith('/results');
    const ctaHref = reportOrResults ? '/results' : '/#find-lawmakers';
    const ctaLabel = reportOrResults ? 'Change district' : 'Find my lawmakers';

    return (
        <header className="sticky top-0 z-20 border-b border-[var(--border)]/90 bg-white/92 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="inline-flex items-center gap-3">
                    <span className="text-lg font-semibold text-[var(--ink)] sm:text-xl">Epstein Files Tracker</span>
                </Link>

                <div className="flex items-center gap-3 sm:gap-5">
                    <nav className="hidden items-center gap-4 sm:flex">
                        <Link
                            href="/epstein-files"
                            className={`text-sm font-semibold transition ${methodActive ? 'border-b-2 border-[var(--brand-blue)] pb-0.5 text-slate-900' : 'text-slate-700 hover:text-slate-900'}`}
                            aria-current={methodActive ? 'page' : undefined}
                        >
                            Sources & Method
                        </Link>
                        <a
                            href="/data/epstein_scores.json"
                            className="text-sm font-semibold text-slate-700 transition hover:text-slate-900"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Raw data
                        </a>
                    </nav>
                    {!isHome && (
                        <Link
                            href={ctaHref}
                            className="inline-flex items-center rounded-md bg-[var(--brand-blue)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0d2f59] sm:text-sm"
                        >
                            {ctaLabel}
                        </Link>
                    )}
                    <div className="sm:hidden">
                        <Link href="/epstein-files" className="text-xs font-semibold text-slate-700">Method</Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
