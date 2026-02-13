'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();
    const methodActive = pathname.startsWith('/epstein-files');
    const actActive = pathname.startsWith('/transparency-act');
    const isHome = pathname === '/';
    const reportOrResults = pathname.startsWith('/report/') || pathname.startsWith('/results');
    const ctaHref = reportOrResults ? '/results' : '/#find-lawmakers';
    const ctaLabel = reportOrResults ? 'Change district' : 'Find my lawmakers';

    return (
        <header className="sticky top-0 z-20 border-b border-[var(--border)]/90 bg-white/92 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-5 md:px-6 lg:px-8 xl:px-0">
                <Link href="/" className="inline-flex items-center">
                    <span className="whitespace-nowrap text-base font-semibold leading-tight text-[var(--ink)] xl:hidden">Public Record</span>
                    <span className="hidden whitespace-nowrap text-base font-semibold leading-tight text-[var(--ink)] xl:inline xl:text-lg">
                        Public Record: Epstein-Related Exploitation
                    </span>
                </Link>

                <div className="flex items-center gap-2 sm:gap-4">
                    <nav className="hidden items-center gap-3 md:flex">
                        <Link
                            href="/epstein-files"
                            className={`text-sm font-semibold transition ${methodActive ? 'border-b-2 border-[var(--brand-blue)] pb-0.5 text-slate-900' : 'text-slate-700 hover:text-slate-900'}`}
                            aria-current={methodActive ? 'page' : undefined}
                        >
                            <span className="lg:hidden">Method</span>
                            <span className="hidden lg:inline">Sources & Method</span>
                        </Link>
                        <Link
                            href="/transparency-act"
                            className={`text-sm font-semibold transition ${actActive ? 'border-b-2 border-[var(--brand-blue)] pb-0.5 text-slate-900' : 'text-slate-700 hover:text-slate-900'}`}
                            aria-current={actActive ? 'page' : undefined}
                        >
                            <span className="lg:hidden">Act</span>
                            <span className="hidden lg:inline">Transparency Act</span>
                        </Link>
                    </nav>
                    {!isHome && (
                        <Link
                            href={ctaHref}
                            className="hidden items-center rounded-md bg-[var(--brand-blue)] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0d2f59] md:inline-flex lg:px-3 lg:text-sm"
                        >
                            {ctaLabel}
                        </Link>
                    )}
                    <div className="md:hidden">
                        <div className="flex items-center gap-2">
                            <Link href="/epstein-files" className="text-xs font-semibold text-slate-700">Method</Link>
                            <span className="text-slate-400">·</span>
                            <Link href="/transparency-act" className="text-xs font-semibold text-slate-700">Act</Link>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
