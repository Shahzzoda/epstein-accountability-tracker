'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import RepCard from '../../components/RepCard';

// Using a simplified FIPS to State Abbreviation map
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
    start: string;
    end: string;
    state: string;
    district?: number;
    party: string;
    url?: string;
    address?: string;
    phone?: string;
    contact_form?: string;
    office?: string;
}

interface Legislator {
    id: {
        bioguide: string;
    };
    name: {
        first: string;
        last: string;
        official_full: string;
    };
    bio: {
        birthday: string;
        gender: string;
    };
    terms: Term[];
}

function ResultsContent() {
    const searchParams = useSearchParams();
    const district = searchParams.get('district');
    const stateFips = searchParams.get('stateFips');

    const [legislators, setLegislators] = useState<Legislator[]>([]);
    const [scores, setScores] = useState<any>(null);
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
                // Fetch both legislators and scores in parallel
                const [legRes, scoreRes] = await Promise.all([
                    fetch('/data/current_legislators.json'),
                    fetch('/data/epstein_scores.json')
                ]);

                if (!legRes.ok) throw new Error('Failed to load legislator data');
                // if (!scoreRes.ok) console.warn('Failed to load scores'); // Non-fatal

                const data: Legislator[] = await legRes.json();
                const scoreData = scoreRes.ok ? await scoreRes.json() : null;
                setScores(scoreData);

                const filtered = data.filter(leg => {
                    // Start by picking the last term
                    let currentTerm = leg.terms[leg.terms.length - 1];

                    // Filter by State
                    if (currentTerm.state !== stateAbbr) return false;

                    // Include all Senators for the state
                    if (currentTerm.type === 'sen') return true;

                    // Include Representative for the specific district
                    const targetDist = parseInt(district || '0');
                    if (currentTerm.type === 'rep') {
                        if (currentTerm.district === targetDist) return true;
                    }

                    return false;
                });

                setLegislators(filtered);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [stateAbbr, district]);

    // ... (rendering logic)

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900">
                    How are your representatives doing?
                </h1>
                <p className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                    Epstein transparency tracked to <span className="text-blue-600 font-semibold">{stateAbbr}-{district}</span>.
                </p>
            </header>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : error ? (
                <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
                    <p>Error: {error}</p>
                </div>
            ) : legislators.length === 0 ? (
                <div className="text-center p-12 text-slate-500">
                    <p>No representatives found regarding this location.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {legislators.map((leg, index) => {
                        const bioguideId = leg.id.bioguide;
                        const score = scores?.scores?.[bioguideId] || scores?.default;
                        return (
                            <RepCard key={bioguideId} legislator={leg} scoreData={score} />
                        );
                    })}
                </div>
            )}

            <div className="text-center">
                <button
                    onClick={() => window.location.href = '/'}
                    className="text-indigo-600 hover:underline font-semibold"
                >
                    &larr; Search Again
                </button>
            </div>
        </div>
    );
}

export default function Results() {
    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <Suspense fallback={
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            }>
                <ResultsContent />
            </Suspense>
        </main>
    );
}
