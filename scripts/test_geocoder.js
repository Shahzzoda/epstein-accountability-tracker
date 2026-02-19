const fetch = require('node-fetch');

async function testGeocoder() {
    const lat = 38.8977; // White House
    const lon = -77.0365;
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lon}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;

    console.log(`Fetching: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error('Response not OK:', response.status, response.statusText);
            const text = await response.text();
            console.error('Body:', text);
            return;
        }
        const data = await response.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testGeocoder();
