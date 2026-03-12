import Link from 'next/link';
import { calculateEpsteinScore } from '@/lib/scoring';
import LegislatorAvatar from '@/components/LegislatorAvatar';

interface Term {
    type: string;
    state: string;
    district?: number;
    party: string;
}

interface Legislator {
    id: {
        bioguide: string;
    };
    name: {
        official_full: string;
    };
    terms: Term[];
}

interface ScoreData {
    score?: number;
    status?: string;
    summary?: string;
    epstein_transparency_act?: {
        sponsored?: boolean;
        cosponsored?: boolean;
        cosponsored_date?: string | null;
        signed?: 'yes' | 'no' | boolean | string;
        discharge_petition?: {
            signed?: boolean;
            date?: string | null;
        } | "NOT_APPLICABLE";
    };
}

interface RepCardProps {
    legislator: Legislator;
    scoreData?: ScoreData;
    districtLabel?: string;
    stateFips?: string;
    district?: string;
}

export default function RepCard({ legislator, scoreData, districtLabel, stateFips, district }: RepCardProps) {
    const currentTerm = legislator.terms[legislator.terms.length - 1];
    const isSenator = currentTerm.type === 'sen';

    const calculated = calculateEpsteinScore(scoreData);
    const score = calculated.score;
    const status = calculated.status;
    const summary = calculated.summary;

    const scoreColor = score > 3.0 ? 'text-emerald-700' : score > 2.0 ? 'text-orange-700' : 'text-rose-700';

    return (
        <article className="border-b border-[var(--border)] py-6">
            <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center">
                <div className="h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    <LegislatorAvatar
                        bioguide={legislator.id.bioguide}
                        alt={legislator.name.official_full}
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                    />
                </div>

                <div className="min-w-0">
                    <Link href={`/report/${legislator.id.bioguide}`} className="hover:underline">
                        <h2 className="truncate text-xl text-slate-900">{legislator.name.official_full}</h2>
                    </Link>
                    <p className="text-sm uppercase tracking-wide text-slate-500">
                        {isSenator ? `United States Senator (${currentTerm.state})` : `U.S. Representative (${currentTerm.state}-${currentTerm.district})`} · {currentTerm.party}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{summary}</p>
                </div>

                <div className="text-left sm:text-right">
                    <p className={`text-3xl font-black ${scoreColor}`}>{score.toFixed(1)}</p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{status}</p>
                </div>

                <Link
                    href={{
                        pathname: `/report/${legislator.id.bioguide}`,
                        query: {
                            districtLabel: districtLabel || '',
                            stateFips: stateFips || '',
                            district: district || ''
                        }
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                    See report
                </Link>
            </div>
        </article>
    );
}
