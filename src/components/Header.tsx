'use client';

export default function Header() {
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
        </header>
    );
}
