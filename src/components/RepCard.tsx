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

interface RepCardProps {
    legislator: Legislator;
}

export default function RepCard({ legislator }: RepCardProps) {
    const currentTerm = legislator.terms[legislator.terms.length - 1];
    const { name } = legislator;
    const isSenator = currentTerm.type === 'sen';

    // Calculate tenure (approximate) - simplified
    const firstTerm = legislator.terms[0];
    const startYear = new Date(firstTerm.start).getFullYear();
    const yearsInOffice = new Date().getFullYear() - startYear;

    const imageUrl = `https://raw.githubusercontent.com/unitedstates/images/master/congress/225x275/${legislator.id.bioguide}.jpg`;

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-slate-200 flex hover:shadow-xl transition-shadow">
            <div className="w-32 bg-slate-100 flex-shrink-0 relative">
                <img
                    src={imageUrl}
                    alt={name.official_full}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg';
                    }}
                />
            </div>
            <div className="p-6 flex flex-col gap-4 flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{name.official_full}</h2>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                            {isSenator ? `Senator - ${currentTerm.state}` : `Representative - ${currentTerm.state} District ${currentTerm.district}`}
                        </p>
                        <p className={`text-sm font-semibold mt-1 ${currentTerm.party === 'Democrat' ? 'text-blue-600' : currentTerm.party === 'Republican' ? 'text-red-600' : 'text-purple-600'}`}>
                            {currentTerm.party}
                        </p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                        <p>Serving since {startYear}</p>
                        <p>({yearsInOffice} years)</p>
                    </div>
                </div>

                <div className="space-y-2 text-sm text-slate-700">
                    {currentTerm.address && (
                        <div className="flex gap-2">
                            <span className="font-semibold w-16">Address:</span>
                            <span>{currentTerm.address}</span>
                        </div>
                    )}
                    {currentTerm.phone && (
                        <div className="flex gap-2">
                            <span className="font-semibold w-16">Phone:</span>
                            <a href={`tel:${currentTerm.phone}`} className="text-blue-600 hover:underline">{currentTerm.phone}</a>
                        </div>
                    )}
                    {currentTerm.url && (
                        <div className="flex gap-2">
                            <span className="font-semibold w-16">Website:</span>
                            <a href={currentTerm.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                {currentTerm.url}
                            </a>
                        </div>
                    )}
                    {currentTerm.contact_form && (
                        <div className="flex gap-2">
                            <span className="font-semibold w-16">Contact:</span>
                            <a href={currentTerm.contact_form} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                Form
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
