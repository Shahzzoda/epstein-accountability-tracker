const fs = require('fs');
const path = require('path');

const LEGISLATORS_PATH = path.join(__dirname, '../public/data/current_legislators.json');
const SCORES_PATH = path.join(__dirname, '../public/data/epstein_scores.json');
const COSPONSORS_PATH = path.join(__dirname, '../public/data/cosponsors.txt');
const UNMATCHED_PATH = path.join(__dirname, '../unmatched_cosponsors.txt');

const RO_KHANNA_ID = 'K000389';

try {
    console.log('Loading data...');
    const legislators = JSON.parse(fs.readFileSync(LEGISLATORS_PATH, 'utf8'));
    let scoresData = JSON.parse(fs.readFileSync(SCORES_PATH, 'utf8'));
    const cosponsorsContent = fs.readFileSync(COSPONSORS_PATH, 'utf8');

    // Helper to get active term info
    const getLatestTerm = (leg) => leg.terms[leg.terms.length - 1];

    // Build Lookup Map
    // Key: "LAST|STATE|PARTY_LETTER" -> List of Candidates []
    // We will do a secondary fuzzy match on First Name / Official Name within the list
    const lookupMap = {};

    legislators.forEach(leg => {
        const last = leg.name.last.toLowerCase();
        const term = getLatestTerm(leg);
        const state = term.state;
        const partyLetter = term.party === 'Democrat' ? 'D' : (term.party === 'Republican' ? 'R' : 'I');

        const key = `${last}|${state}|${partyLetter}`;

        if (!lookupMap[key]) {
            lookupMap[key] = [];
        }
        lookupMap[key].push(leg);
    });

    const lines = cosponsorsContent.split('\n');
    const unmatched = [];
    const matchedIds = new Set();
    const cosponsorMap = {}; // ID -> Date

    // Skip header line
    let startIndex = 0;
    if (lines.length > 0 && lines[0].includes('Cosponsor|Date')) {
        startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Line format: Name|Info|Date
        // Example: Johnson, Henry C. "Hank"|[D-GA-4]|07/17/2025
        const parts = line.split('|');
        if (parts.length < 3) {
            console.warn(`Skipping malformed line ${i + 1}: ${line}`);
            continue;
        }

        const rawName = parts[0].trim();
        const rawInfo = parts[1].trim(); // [D-GA-4] or [R-KY-4]*
        const date = parts[2].trim();

        // Parse Info for State and Party
        // Remove brackets and *
        const info = rawInfo.replace(/[\[\]*]/g, ''); // "D-GA-4"
        const infoParts = info.split('-');
        // Expecting 3 parts: Party, State, District
        // Or maybe just Party-State if At Large? "D-DC-At Large"

        // Safety check
        if (infoParts.length < 2) {
            unmatched.push(`Line ${i + 1}: Invalid Info format "${rawInfo}"`);
            continue;
        }

        const partyLetter = infoParts[0]; // D, R, I
        const stateAbbr = infoParts[1]; // GA, NY, etc.

        // Parse Name for Last Name
        // "Johnson, Henry C. "Hank"" -> Last: Johnson
        const nameParts = rawName.split(',');
        const lastName = nameParts[0].trim().toLowerCase();

        // Find Match
        const key = `${lastName}|${stateAbbr}|${partyLetter}`;
        const candidates = lookupMap[key];

        let matchedLeg = null;

        if (candidates) {
            if (candidates.length === 1) {
                // If only one match for Last+State+Party, assume it's them.
                matchedLeg = candidates[0];
            } else {
                // Ambiguous: Multiple matches (e.g. 2 Smiths in same state/party? Rare but possible)
                // Filter by matching first name or parts of official name
                // Rest of name from CSV: "Henry C. "Hank""
                const restName = nameParts.slice(1).join(',').trim().toLowerCase();

                // Try to find best match
                matchedLeg = candidates.find(leg => {
                    const first = leg.name.first.toLowerCase();
                    const nickname = leg.name.nickname ? leg.name.nickname.toLowerCase() : '';
                    const official = leg.name.official_full ? leg.name.official_full.toLowerCase() : '';

                    // Check if First name is in restName
                    if (restName.includes(first)) return true;
                    // Check if Nickname is in restName
                    if (nickname && restName.includes(nickname)) return true;
                    // Check if Official Full contains rawName (fuzzy)
                    if (official.includes(lastName)) {
                        // This check is weak because we already matched last name.
                        // Let's check if the rest of the official name matches restName parts.
                        // Simple: if official full includes the specific "Hank" or "Henry" from restName
                        return true;
                    }
                    return false;
                });
            }
        }

        if (matchedLeg) {
            matchedIds.add(matchedLeg.id.bioguide);
            cosponsorMap[matchedLeg.id.bioguide] = date;
        } else {
            console.log(`Failed to match: ${rawName} (${stateAbbr}-${partyLetter})`);
            // Try fallback: look for ANY match with that Bioguide? No Bioguide here.
            // Try matching only Last Name + State?
            unmatched.push(`${line} (Reason: No match for Last: ${lastName}, State: ${stateAbbr}, Party: ${partyLetter})`);
        }
    }

    // Update Scores
    let sponsoredCount = 0;
    let cosponsoredCount = 0;

    for (const [id, scoreEntry] of Object.entries(scoresData.scores)) {
        // Init section if missing
        if (!scoreEntry.epstein_transparency_act) {
            scoreEntry.epstein_transparency_act = {};
        }

        // 1. Sponsored
        if (id === RO_KHANNA_ID) {
            scoreEntry.epstein_transparency_act.sponsored = true;
            sponsoredCount++;
        } else {
            // Explicitly set false or leave undefined? User said "others = false".
            scoreEntry.epstein_transparency_act.sponsored = false;
        }

        // 2. Cosponsored
        if (cosponsorMap[id]) {
            scoreEntry.epstein_transparency_act.cosponsored = true;
            scoreEntry.epstein_transparency_act.cosponsored_date = cosponsorMap[id];
            cosponsoredCount++;
        } else {
            scoreEntry.epstein_transparency_act.cosponsored = false;
            // Remove date if it existed? Or set null?
            delete scoreEntry.epstein_transparency_act.cosponsored_date;
        }
    }

    // Save outputs
    fs.writeFileSync(SCORES_PATH, JSON.stringify(scoresData, null, 2));
    fs.writeFileSync(UNMATCHED_PATH, unmatched.join('\n'));

    console.log(`Updated Scores.`);
    console.log(`Sponsored (Ro Khanna): ${sponsoredCount}`);
    console.log(`Cosponsored Count: ${cosponsoredCount} / ${lines.length - startIndex} lines processed.`);
    console.log(`Unmatched Cosponsors: ${unmatched.length}. See unmatched_cosponsors.txt`);

} catch (err) {
    console.error('Error:', err);
}
