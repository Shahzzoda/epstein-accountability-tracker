'use client';

export default function Header() {
    return (
        <header className="sticky top-0 z-20 bg-[#B22234] text-white shadow-sm">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-center px-4 sm:px-5 md:px-6 lg:px-8 xl:px-0">
                <p className="text-center font-bold text-white">
                    WARNING: You are viewing beta. Data may be inaccurate.
                </p>
            </div>
        </header>
    );
}
