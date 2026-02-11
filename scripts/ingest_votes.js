const fs = require('fs');
const path = require('path');

const LEGISLATORS_PATH = path.join(__dirname, '../public/data/current_legislators.json');
const SCORES_PATH = path.join(__dirname, '../public/data/epstein_scores.json');
const CSV_PATH = path.join(__dirname, '../public/data/house_roll_call_vote_289.csv');
const UNMATCHED_PATH = path.join(__dirname, '../unmatched_names.txt');

// State Name to Abbreviation Map
const STATE_MAP = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
    "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
    "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
    "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
    "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
    "District of Columbia": "DC", "Puerto Rico": "PR", "American Samoa": "AS", "Guam": "GU",
    "Northern Mariana Islands": "MP", "Virgin Islands": "VI"
};

// Vote Status Map
const VOTE_MAP = {
    "Aye": "yes",
    "Yea": "yes",
    "No": "no",
    "Nay": "no",
    "Not Voting": "not_present",
    "Present": "abstained"
};

try {
    console.log('Loading data...');
    const legislators = JSON.parse(fs.readFileSync(LEGISLATORS_PATH, 'utf8'));
    let scoresData = JSON.parse(fs.readFileSync(SCORES_PATH, 'utf8'));
    const csvContent = fs.readFileSync(CSV_PATH, 'utf8');

    // Helper to get active term info
    const getLatestTerm = (leg) => leg.terms[leg.terms.length - 1];

    const lookupMap = {}; // Key: "LAST|FIRST_WORD|STATE|PARTY_LETTER" -> ID

    legislators.forEach(leg => {
        const last = leg.name.last.toLowerCase();
        // Use split to get just the first word, ignoring middle names if in first name field
        const first = leg.name.first.split(' ')[0].toLowerCase();
        const term = getLatestTerm(leg);
        const state = term.state;
        const partyLetter = term.party === 'Democrat' ? 'D' : (term.party === 'Republican' ? 'R' : 'I');

        // Helper to add key safely
        const addKey = (nameVariant) => {
            if (nameVariant) {
                // Ensure we only use the first word of the variant for matching against "First" in CSV
                // The CSV parser extracts "First" as the first token after the comma.
                const cleanVariant = nameVariant.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
                if (cleanVariant) {
                    const key = `${last}|${cleanVariant}|${state}|${partyLetter}`;
                    lookupMap[key] = leg.id.bioguide;
                }
            }
        };

        // 1. First Name Field (Cleaned)
        addKey(leg.name.first);

        // 2. Nickname Field
        if (leg.name.nickname) {
            addKey(leg.name.nickname);
        }

        // 3. Parse "(Nickname)" from first name field if present, e.g. "Nicole (Nikki)"
        if (leg.name.first.includes('(')) {
            const match = leg.name.first.match(/\(([^)]+)\)/);
            if (match) {
                addKey(match[1]);
            }
        }

        // 4. First word of official_full, e.g. "Elijah Crane" -> "Elijah"
        if (leg.name.official_full) {
            addKey(leg.name.official_full);
        }
    });

    const lines = csvContent.split('\n');
    const unmatched = [];
    let updatedCount = 0;

    let startIndex = 0;
    while (startIndex < lines.length && !lines[startIndex].startsWith('Representative,Party')) {
        startIndex++;
    }
    startIndex++; // Skip header row

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        let rawName, rawParty, rawState, rawVote;

        // Try regex first for simple cases
        const simpleMatch = line.match(/^"([^"]+)",([^,]+),([^,]+),([^,]+),?$/);

        if (simpleMatch) {
            [_, rawName, rawParty, rawState, rawVote] = simpleMatch;
        } else {
            // Complex parsing
            const firstQuoteIdx = line.indexOf('"');
            const lastQuoteIdx = line.lastIndexOf('",');

            if (firstQuoteIdx !== -1 && lastQuoteIdx !== -1) {
                rawName = line.substring(firstQuoteIdx + 1, lastQuoteIdx).replace(/""/g, '"');
                const rest = line.substring(lastQuoteIdx + 2);
                [rawParty, rawState, rawVote] = rest.split(',');
            } else {
                console.warn(`Skipping malformed line ${i + 1}: ${line}`);
                continue;
            }
        }

        // Parse Name: "Adams, Alma S. [D-NC]"
        const namePart = rawName.split('[')[0].trim(); // "Adams, Alma S."
        const [lastNameRaw, firstNameRest] = namePart.split(',').map(s => s.trim());

        // Get the first word of the first name part. 
        // "Alma S." -> "Alma"
        // "J. French" -> "J." (handled by indexing official_full?)
        // Let's clean it similarly to how we cleaned keys
        const firstNameFirstWord = firstNameRest.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');

        // Map State
        const stateAbbr = STATE_MAP[rawState.trim()];
        if (!stateAbbr) {
            unmatched.push(`Line ${i + 1}: Unknown State "${rawState}" for ${rawName}`);
            continue;
        }

        // Map Party
        const partyLetter = rawParty.trim() === 'Democratic' ? 'D' : (rawParty.trim() === 'Republican' ? 'R' : 'I');

        // Construct Key
        const key = `${lastNameRaw.toLowerCase()}|${firstNameFirstWord}|${stateAbbr}|${partyLetter}`;

        const bioguideId = lookupMap[key];

        if (bioguideId) {
            // Update Score
            if (!scoresData.scores[bioguideId]) {
                scoresData.scores[bioguideId] = { ...scoresData.default };
            }
            if (!scoresData.scores[bioguideId].epstein_transparency_act) {
                scoresData.scores[bioguideId].epstein_transparency_act = {};
            }
            const signedStatus = VOTE_MAP[rawVote.trim()] || "unknown";
            scoresData.scores[bioguideId].epstein_transparency_act.signed = signedStatus;
            updatedCount++;
        } else {
            unmatched.push(`${rawName} (State: ${stateAbbr}, Party: ${partyLetter}) - Key: ${key}`);
        }
    }

    // Save outputs
    fs.writeFileSync(SCORES_PATH, JSON.stringify(scoresData, null, 2));
    fs.writeFileSync(UNMATCHED_PATH, unmatched.join('\n'));

    console.log(`Updated ${updatedCount} records.`);
    console.log(`Unmatched: ${unmatched.length}. See unmatched_names.txt`);

} catch (err) {
    console.error('Error:', err);
}
