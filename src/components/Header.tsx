'use client';

export default function Header() {
    return (
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#3e4652] text-white shadow-sm">
            <div className="mx-auto flex h-10 max-w-6xl items-center justify-center px-4 sm:px-5 md:px-6 lg:px-8 xl:px-0">
                <p className="text-center text-xs font-semibold tracking-[0.08em] text-white sm:text-sm">
                    NOTICE: Beta site. Data may be inaccurate.
                </p>
            </div>
        </header>
    );
}
