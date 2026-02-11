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
                const res = await fetch('/data/current_legislators.json');
                if (!res.ok) throw new Error('Failed to load legislator data');
                const data: Legislator[] = await res.json();

                const filtered = data.filter(leg => {
                    // Start by picking the last term
                    let currentTerm = leg.terms[leg.terms.length - 1];

                    // Sanity check: if the last term end date is in the past, scanning backwards?
                    // Usually "current" file means they are currently serving, but let's just log.

                    // Filter by State
                    if (currentTerm.state !== stateAbbr) return false;

                    // Include all Senators for the state
                    if (currentTerm.type === 'sen') return true;

                    // Include Representative for the specific district
                    const targetDist = parseInt(district || '0');
                    if (currentTerm.type === 'rep') {
                        // console.log(`Checking ${leg.name.official_full} - Term: ${currentTerm.state} ${currentTerm.district} vs Target: ${stateAbbr} ${targetDist}`);
                        if (currentTerm.district === targetDist) return true;
                    }

                    return false;
                });
                console.log(`Debug: StateFips=${stateFips} -> Abbr=${stateAbbr}, District=${district}. Found ${filtered.length} matches.`);

                setLegislators(filtered);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [stateAbbr, district]);

    if (!stateFips || !district) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-xl text-slate-500 mb-4">Missing location information.</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="text-indigo-600 hover:underline font-semibold"
                    >
                        &larr; Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">Your Representatives</h1>
                <p className="text-slate-600">
                    Found for {stateAbbr} District {district}
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
                    <p className="text-sm">Debug: State {stateAbbr}, District {district}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {legislators.map((leg, index) => (
                        // Using index as key because IDs might be complex or nested, though bioguide is better if available
                        // leg.id.bioguide is unique
                        <RepCard key={index} legislator={leg} />
                    ))}
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
