# Rep Finder

**Epstein transparency — tracked to your district.**

We’re building a public record of what Congress required, what DOJ/FBI have released, what they’re withholding, and which elected officials pushed for disclosure versus slowed it down. Then we tie it to your Rep and Senators with a simple scorecard and sources.

## Pages

### 1. Landing Page (`/`)
- **Mission**: Explain the transparency initiative.
- **Action**: "Find my representatives" button to locate the user's district.
- **Backend API**: Send coordinates to our internal API route `/api/locate`.

### 2. Results Page (`/results`)
- **Filtering**: Filters a static dataset of legislators based on the user's State and Congressional District.
- **Display**: Shows cards for:
    - **Senators** (2 per state)
    - **Representative** (1 per district)
- **Details**: Each card includes the legislator's photo, party, tenure, office address, phone number, and website.

## Approach & Architecture

### Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: TypeScript

### Data Flow
1. **Geolocation**: The app requests the user's location (Latitude/Longitude).
2. **District Lookup**: 
   - The app calls `/api/locate` with these coordinates.
   - The API proxies the request to the **U.S. Census Bureau Geocoder API** (`geocoding.geo.census.gov`).
   - It parses the response to identify the correct "Congressional District" and State FIPS code.
3. **Legislator Lookup**:
   - The app loads a static JSON file (`current_legislators.json`).
   - It filters this data client-side to find members matching the State and District.
   - Images are loaded dynamically using the legislator's unique Bioguide ID.

## Credits

This project relies on the excellent data and assets provided by the **[unitedstates](https://github.com/unitedstates)** GitHub organization.

- **Legislator Data**: Sourced from [unitedstates/congress-legislators](https://github.com/unitedstates/congress-legislators).
- **Legislator Images**: Sourced from [unitedstates/images](https://github.com/unitedstates/images).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
