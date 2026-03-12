# Rep Finder
<img width="1446" height="996" alt="image" src="https://github.com/user-attachments/assets/4173a43d-02fc-4682-b89e-8f0dbfe17097" />
<img width="1404" height="963" alt="image" src="https://github.com/user-attachments/assets/fe4495f6-b279-40eb-a43a-691df8034462" />


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

## How to Run (For Everyone)

You don't need to be a coder to run this! You just need a computer and about 5 minutes.

### 1. Prerequisite
Ensure you have **Node.js** installed.
- [Download Node.js here](https://nodejs.org/) (Click the "LTS" version).
- To check if you have it, open your Terminal (Mac) or Command Prompt (Windows) and type `node -v`. If it prints a number like `v20.x.x` or higher, you are good.

### 2. Get the Code
- **Option A (Easier):** Click the green **Code** button on this page and select **Download ZIP**. Unzip the folder to your Desktop.
- **Option B (Coders):** Run `git clone [repository-url]` in your terminal.

### 3. Start the App
1. Open your Terminal or Command Prompt.
2. Type `cd` followed by a space, then drag the unzipped folder into the terminal window. It should look like `cd /Users/you/Desktop/rep-finder`. Press Enter.
3. Type `npm install` and press Enter. Wait for it to finish (it might take a minute).
4. Type `npm run dev` and press Enter.

### 4. View it
Open your web browser (Chrome, Safari, etc.) and go to:
[http://localhost:3000](http://localhost:3000)

## How to Contribute

We need help verifying data!

- **Found a mistake?**
  - If you have a GitHub account, [open an Issue](https://github.com/your-repo/rep-finder/issues).
  - If not, email us at `[maintainer-email]` (Subject: Data Correction).

- **Want to add missing data?**
  - Use the "Join the effort" link in the app footer to contact the team.
