import React from 'react';

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

interface ScoreData {
    score: number;
    status: string;
    notes?: string;
}

interface RepCardProps {
    legislator: Legislator;
    scoreData?: ScoreData;
}

export default function RepCard({ legislator, scoreData }: RepCardProps) {
    const [expanded, setExpanded] = React.useState(false);
    const currentTerm = legislator.terms[legislator.terms.length - 1];
    const { name } = legislator;
    const isSenator = currentTerm.type === 'sen';

    const startYear = new Date(legislator.terms[0].start).getFullYear();
    const yearsInOffice = new Date().getFullYear() - startYear;

    const imageUrl = `https://raw.githubusercontent.com/unitedstates/images/master/congress/225x275/${legislator.id.bioguide}.jpg`;

    // Score Logic (1-5)
    // 0 is bad, 5 is outstanding.
    const score = scoreData?.score || 2.5;
    const status = scoreData?.status || 'Unknown';

    const getScoreColor = (s: number) => {
        if (s > 2.5) return 'text-green-600';
        if (s < 2.5) return 'text-red-600';
        return 'text-slate-400'; // Unknown / 2.5 (Grey)
    };

    const scoreColor = getScoreColor(score);

    return (
        <div
            className={`bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200 transition-all cursor-pointer hover:shadow-md ${expanded ? 'ring-2 ring-indigo-500' : ''}`}
            onClick={() => setExpanded(!expanded)}
        >
            {/* Collapsed Row View */}
            <div className="flex items-center p-4 gap-4">
                {/* Image */}
                <div className="w-16 h-16 bg-slate-100 flex-shrink-0 rounded-full overflow-hidden border border-slate-100">
                    <img
                        src={imageUrl}
                        alt={name.official_full}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg';
                        }}
                    />
                </div>

                {/* Name & Role */}
                <div className="flex-grow min-w-0">
                    <h2 className="text-lg font-bold text-slate-900 truncate">{name.official_full}</h2>
                    <p className="text-sm text-slate-500 uppercase tracking-wide">
                        {isSenator ? `United States Senator (${currentTerm.state})` : `U.S. Representative (${currentTerm.state}-${currentTerm.district})`} &middot; {currentTerm.party}
                    </p>
                </div>

                {/* Score Summary */}
                <div className="text-right flex-shrink-0">
                    <div className={`text-2xl font-black ${scoreColor}`}>{score.toFixed(1)}/5</div>
                    <div className="text-xs text-slate-500 font-medium uppercase">{status}</div>
                </div>

                {/* Expand Icon */}
                <div className="text-slate-400">
                    {expanded ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    )}
                </div>
            </div>

            {/* Expanded Details View */}
            {expanded && (
                <div className="border-t border-slate-100 p-6 bg-slate-50 flex flex-col md:flex-row gap-6 animate-in slide-in-from-top-2 duration-200">
                    {/* Score Breakdown Area */}
                    <div className="flex-1 space-y-3">
                        <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-2">Epstein Accountability Score</h3>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
                            <span className="text-slate-500">/ 5</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {scoreData?.notes || "We do not yet have specific data on this legislator's actions regarding the Epstein case. The default score of 2.5 indicates 'Neutral/Baseline'."}
                        </p>
                    </div>

                    {/* Contact & Bio Info */}
                    <div className="flex-1 space-y-2 text-sm text-slate-600 border-l border-slate-200 pl-0 md:pl-6 border-l-0 md:border-l">
                        <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-3">Contact & Details</h3>
                        <p><span className="font-medium">Tenure:</span> {yearsInOffice} years (Since {startYear})</p>
                        {currentTerm.phone && (
                            <p><span className="font-medium">Phone:</span> <a href={`tel:${currentTerm.phone}`} className="text-blue-600 hover:underline">{currentTerm.phone}</a></p>
                        )}
                        {currentTerm.address && (
                            <p><span className="font-medium">Office:</span> {currentTerm.address}</p>
                        )}
                        {currentTerm.url && (
                            <p><span className="font-medium">Website:</span> <a href={currentTerm.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{currentTerm.url}</a></p>
                        )}
                        {currentTerm.contact_form && (
                            <p><span className="font-medium">Contact:</span> <a href={currentTerm.contact_form} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Form</a></p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
