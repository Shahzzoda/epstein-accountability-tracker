'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFindReps = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(`/api/locate?lat=${latitude}&lon=${longitude}`);
          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to locate district');
          }

          const data = await response.json();
          // Assuming data returns something like { district: '12', state: '24' } or similar
          // The Census API returns properties like "CD119", "STATE", "GEOID"
          // We need to map or pass this to the results page.
          // Let's pass the raw district/state codes or whatever the JSON uses.
          // Note: The Census API returns FIPS codes for state.
          // We might need a mapping if current_legislators.json uses state abbreviations (e.g., "CA").

          // For now, let's redirect with the raw result and handle mapping on the results page or here if needed.
          // However, better to make the URL clean: /results?district=12&state=CA
          // The Census API returns "STATE" as a FIPS code (e.g., "06" for California).
          // We might need to map FIPS to Abbreviation. I'll add a utility for that or just pass the FIPS and handle it.
          // Let's pass the raw data for now and refine.

          // Actually, let's look at the API response structure again. 
          // Usually returns "BASENAME": "119th Congressional District 12" -> District 12
          // "STATE": "06"

          // Simplified: Just pass lat/lon to results and let results do the fetching? 
          // No, the prompt said: "button -> hits share address... backend api hits Census... page 2 info on reps"
          // So the flow: Landing -> [Click] -> API returns District Info -> Redirect to Results with District Info.

          // Let's assume for now we get a district number and state FIPS.
          // Construct URL.

          // Wait, I don't have the FIPS to State Abbrev map yet.
          // I'll skip the mapping for a second and just pass the raw data returned to the URL query strings.
          // We can refine this.

          // The API now returns { district: "19", state: "36", ... }
          const district = data.district || '00';
          const stateFips = data.state || '00';

          router.push(`/results?district=${district}&stateFips=${stateFips}`);

        } catch (err: any) {
          setError(err.message || 'An error occurred while locating you.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Unable to retrieve your location. Please allow location access.');
        setLoading(false);
      }
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-800">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-slate-900">
          Participate in <span className="text-blue-600">Democracy</span>
        </h1>

        <p className="text-lg leading-8 text-slate-600">
          Our mission is to make it easy for every citizen to connect with their representatives.
          We believe that an informed and engaged public is the cornerstone of a healthy republic.
          Find out who represents you and how to contact them.
        </p>

        <div className="flex flex-col items-center justify-center gap-4">
          <button
            onClick={handleFindReps}
            disabled={loading}
            className="rounded-md bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Locating...' : 'Find My Representatives'}
          </button>

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}

          <p className="text-xs text-slate-400 mt-4">
            We will ask for your location to identify your congressional district.
            Your location data is not stored.
          </p>
        </div>
      </div>
    </main>
  );
}
