import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="border-t border-[var(--border)] bg-slate-50 py-12">
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                    <p className="text-sm text-slate-500">
                        &copy; {new Date().getFullYear()} Rep Finder. All rights reserved.
                    </p>
                    <div className="flex flex-wrap gap-6 text-sm font-semibold text-slate-600">
                        <Link href="/epstein-files" className="hover:text-[var(--brand-blue)] hover:underline">
                            How scoring works
                        </Link>
                        <Link href="/leaderboard" className="hover:text-[var(--brand-blue)] hover:underline">
                            Leaderboard
                        </Link>
                        <Link href="/about" className="hover:text-[var(--brand-blue)] hover:underline">
                            About
                        </Link>
                        <a href="mailto:corrections@example.com" className="hover:text-[var(--brand-blue)] hover:underline">
                            Something looks wrong?
                        </a>
                        <a href="https://x.com/zodattack" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand-blue)] hover:underline">
                            Join the effort
                        </a>
                    </div>
                </div>
                <div className="mt-8 text-center text-xs text-slate-400">
                    <p>
                        Data sourced from public records. Some sections may use AI-generated content. ALl sources are linked.
                    </p>
                </div>
            </div>
        </footer>
    );
}
