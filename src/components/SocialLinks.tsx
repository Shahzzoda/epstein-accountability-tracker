import { SocialMedia } from '@/lib/scoring';

function TwitterIcon() {
    return (
        <svg className="h-4 w-4 text-slate-400 hover:text-black" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function FacebookIcon() {
    return (
        <svg className="h-4 w-4 text-slate-400 hover:text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
        </svg>
    );
}

function InstagramIcon() {
    return (
        <svg
            className="h-4 w-4 text-slate-400 hover:text-[#E4405F]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
    );
}

function YouTubeIcon() {
    return (
        <svg className="h-4 w-4 text-slate-400 hover:text-[#FF0000]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 01-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 01-1.768-1.768C2 15.255 2 12 2 12s0-3.254.418-4.814a2.507 2.507 0 011.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418zM15.194 12 10 15V9l5.194 3z" clipRule="evenodd" />
        </svg>
    );
}

interface SocialLinksProps {
    socials: SocialMedia;
}

export default function SocialLinks({ socials }: SocialLinksProps) {
    return (
        <div className="flex items-center gap-3">
            {socials.twitter && (
                <a
                    href={`https://twitter.com/${socials.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-110"
                    title="Twitter"
                >
                    <TwitterIcon />
                </a>
            )}
            {socials.facebook && (
                <a
                    href={`https://facebook.com/${socials.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-110"
                    title="Facebook"
                >
                    <FacebookIcon />
                </a>
            )}
            {socials.instagram && (
                <a
                    href={`https://instagram.com/${socials.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-110"
                    title="Instagram"
                >
                    <InstagramIcon />
                </a>
            )}
            {socials.youtube && (
                <a
                    href={`https://youtube.com/${socials.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-110"
                    title="YouTube"
                >
                    <YouTubeIcon />
                </a>
            )}
        </div>
    );
}
