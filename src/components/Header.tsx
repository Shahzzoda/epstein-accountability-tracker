'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();
    const isHome = pathname === '/';

    return (
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#3e4652] text-white shadow-sm">
            <div className="mx-auto flex min-h-[40px] max-w-6xl items-center justify-center px-4 py-1.5 sm:px-5 md:px-6 lg:px-8 xl:px-0">
                <p className="text-center text-xs font-semibold tracking-[0.08em] text-white sm:text-sm">
                    NOTICE: Website still in early development. Data may be inaccurate.{' '}
                    <a
                        href="https://github.com/Shahzzoda/epstein-accountability-tracker"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-white/50 underline-offset-2 transition hover:text-slate-200"
                    >
                        Join the effort
                    </a>
                </p>
            </div>
            {!isHome && (
                <nav className="border-b border-slate-200 bg-white">
                    <div className="mx-auto flex h-12 max-w-6xl items-center gap-6 px-4 sm:px-5 md:px-6 lg:px-8 xl:px-0">
                        <Link href="/" className="text-sm font-semibold text-slate-900 hover:text-[var(--brand-blue)]">
                            Home
                        </Link>
                        <Link href="/epstein-files" className="text-sm font-semibold text-slate-600 hover:text-[var(--brand-blue)]">
                            Methodology
                        </Link>
                        <Link href="/about" className="text-sm font-semibold text-slate-600 hover:text-[var(--brand-blue)]">
                            About
                        </Link>
                    </div>
                </nav>
            )}
        </header>
    );
}
