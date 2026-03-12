import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const address = searchParams.get('address');

    if ((!lat || !lon) && !address) {
        return NextResponse.json({ error: 'Either Latitude/Longitude or Address is required' }, { status: 400 });
    }

    try {
        let url = '';
        if (address) {
            url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
        } else {
            url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lon}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch from Census Geocoder');
        }

        const data = await response.json();
        console.log('Census Geocoder Response:', JSON.stringify(data, null, 2));

        let geographies;
        if (address) {
            if (!data.result?.addressMatches || data.result.addressMatches.length === 0) {
                return NextResponse.json({ error: 'Could not find that address' }, { status: 404 });
            }
            geographies = data.result.addressMatches[0].geographies;
        } else {
            geographies = data.result?.geographies;
        }

        // The key changes based on the congress (e.g. "119th Congressional Districts")
        // Find the key that contains "Congressional Districts"
        const districtKey = Object.keys(geographies || {}).find(key => key.includes('Congressional Districts'));
        const congressionalDistricts = districtKey ? geographies[districtKey] : [];

        if (congressionalDistricts && congressionalDistricts.length > 0) {
            const district = congressionalDistricts[0];
            // "119th Congressional District 19" -> We likely want "19". 
            // BASENAME is often just the number or name. For NY 19, BASENAME is "19".
            // CDSESSN is "119" (Session).
            // Let's use BASENAME as the district number/ID.
            return NextResponse.json({
                district: district.BASENAME,
                state: district.STATE,
                name: district.NAME,
                geoid: district.GEOID
            });
        }

        // Fallback: Check other potential layer names if "Congressional Districts" isn't exact or if using a different vintage
        console.warn('No Congressional Districts found in response:', JSON.stringify(data, null, 2));
        return NextResponse.json({ error: 'No congressional district found for these coordinates' }, { status: 404 });

    } catch (error) {
        console.error('Geocoder error:', error);
        return NextResponse.json({ error: 'Failed to determine location' }, { status: 500 });
    }
}
