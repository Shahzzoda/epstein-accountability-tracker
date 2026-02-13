'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import RepCard from '../../components/RepCard';

const fipsToState: Record<string, string> = {
    '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC',
    '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY',
    '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT',
    '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
    '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
    '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY', '60': 'AS', '66': 'GU', '69': 'MP',
    '72': 'PR', '78': 'VI'
};

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

interface ScoreEntry {
    score: number;
    status: string;
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

interface ScoreFile {
    scores?: Record<string, ScoreEntry>;
    default?: ScoreEntry;
}

function ResultsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const district = searchParams.get('district');
    const stateFips = searchParams.get('stateFips');

    const [legislators, setLegislators] = useState<Legislator[]>([]);
    const [scores, setScores] = useState<ScoreFile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const stateAbbr = stateFips ? fipsToState[stateFips] : null;

    useEffect(() => {
        if (!stateAbbr) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const [legRes, scoreRes] = await Promise.all([
                    fetch('/data/current_legislators.json'),
                    fetch('/data/epstein_scores.json')
                ]);

                if (!legRes.ok) throw new Error('Failed to load legislator data');

                const data: Legislator[] = await legRes.json();
                const scoreData: ScoreFile | null = scoreRes.ok ? await scoreRes.json() : null;
                setScores(scoreData);

                const targetDist = parseInt(district || '0');
                const filtered = data.filter((leg) => {
                    const currentTerm = leg.terms[leg.terms.length - 1];

                    if (currentTerm.state !== stateAbbr) return false;
                    if (currentTerm.type === 'sen') return true;
                    if (currentTerm.type === 'rep' && currentTerm.district === targetDist) return true;
                    return false;
                });

                setLegislators(filtered);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to load representative data';
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [stateAbbr, district]);

    return (
        <div className="mx-auto w-full max-w-6xl space-y-8">
            <header className="fade-up border-b border-[var(--border)] pb-6">
                <h1 className="mt-2 text-3xl leading-tight text-slate-900 sm:text-4xl">{stateAbbr}-{district} Snapshot: Your lawmakers on the record</h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--ink-soft)] sm:text-base">
                    Each District has two senators and one house representative. These are the leaders that represent you in Congress. These profiles show what each member did in public records tied to Epstein-file disclosure.
                </p>
            </header>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--brand-blue)]" />
                </div>
            ) : error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-700">
                    <p>Error: {error}</p>
                </div>
            ) : legislators.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                    <p>No representatives found regarding this location.</p>
                </div>
            ) : (
                <div className="flex flex-col">
                    {legislators.map((leg) => {
                        const bioguideId = leg.id.bioguide;
                        const score = scores?.scores?.[bioguideId] || scores?.default;
                        return (
                            <RepCard
                                key={bioguideId}
                                legislator={leg}
                                scoreData={score}
                                districtLabel={`${stateAbbr}-${district}`}
                                stateFips={stateFips || ''}
                                district={district || ''}
                            />
                        );
                    })}
                </div>
            )}

            <div className="text-center">
                <button
                    onClick={() => router.push('/')}
                    className="font-semibold text-[var(--brand-blue)] hover:underline"
                >
                    &larr; Check another district
                </button>
            </div>
        </div>
    );
}

export default function Results() {
    return (
        <main className="startup-shell min-h-screen p-6">
            <Suspense
                fallback={
                    <div className="flex justify-center p-12">
                        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--brand-blue)]" />
                    </div>
                }
            >
                <ResultsContent />
            </Suspense>
        </main>
    );
}
