const fs = require('fs');
const path = require('path');

const LEGISLATORS_PATH = path.join(__dirname, '../public/data/current_legislators.json');
const SCORES_PATH = path.join(__dirname, '../public/data/epstein_scores.json');
const COSPONSORS_PATH = path.join(__dirname, '../public/data/eft_act/senate_cosponsors.txt');

try {
    console.log("Loading data...");
    const legislators = JSON.parse(fs.readFileSync(LEGISLATORS_PATH, 'utf8'));
    const scoresData = JSON.parse(fs.readFileSync(SCORES_PATH, 'utf8'));

    // Read cosponsors text file
    if (!fs.existsSync(COSPONSORS_PATH)) {
        throw new Error(`Cosponsors file not found at ${COSPONSORS_PATH}`);
    }
    const rawText = fs.readFileSync(COSPONSORS_PATH, 'utf8');
    const lines = rawText.split('\n').filter(line => line.trim() !== '' && !line.startsWith('Cosponsor|'));

    console.log(`Found ${lines.length} cosponsor lines.`);

    // Helper to find bioguide by name
    function findBioguideByName(lastName, firstName) {
        // Construct "First Last"
        const targetFullName = `${firstName} ${lastName}`.toLowerCase();

        // Find matching legislator
        const match = legislators.find(leg => {
            const official = leg.name.official_full.toLowerCase();
            // Simple match or robust match?
            // "Ben Ray Luján", "Ben Ray"
            // The file has "Luján, Ben Ray"
            return official === targetFullName || official.includes(lastName.toLowerCase()) && official.includes(firstName.toLowerCase());
        });

        return match ? match.id.bioguide : null;
    }

    let updatedCount = 0;
    let unmatched = [];

    lines.forEach(line => {
        // Line format: Luján, Ben Ray|[D-NM]*|07/30/2025
        const parts = line.split('|');
        if (parts.length < 3) return;

        const namePart = parts[0].trim(); // "Luján, Ben Ray"
        const datePart = parts[2].trim(); // "07/30/2025"

        // Split Name
        // Handle "Last, First Middle" if present, but usually just Last, First
        const nameSplit = namePart.split(',');
        if (nameSplit.length < 2) {
            console.warn(`Skipping malformed name: ${namePart}`);
            return;
        }

        const lastName = nameSplit[0].trim();
        const firstName = nameSplit[1].trim();

        const bioguideId = findBioguideByName(lastName, firstName);

        if (bioguideId) {
            // Found! Update score
            if (!scoresData.scores[bioguideId]) {
                scoresData.scores[bioguideId] = { ...scoresData.default };
            }
            if (!scoresData.scores[bioguideId].epstein_transparency_act) {
                scoresData.scores[bioguideId].epstein_transparency_act = {};
            }

            scoresData.scores[bioguideId].epstein_transparency_act.cosponsored = true;
            scoresData.scores[bioguideId].epstein_transparency_act.cosponsored_date = datePart;
            updatedCount++;
        } else {
            console.warn(`Unmatched: ${firstName} ${lastName}`);
            unmatched.push(`${firstName} ${lastName}`);
        }
    });

    // Special Case: Jeff Merkley (M001176) as Sponsor
    console.log("Setting Jeff Merkley (M001176) as Sponsor...");
    if (scoresData.scores['M001176']) {
        if (!scoresData.scores['M001176'].epstein_transparency_act) {
            scoresData.scores['M001176'].epstein_transparency_act = {};
        }
        scoresData.scores['M001176'].epstein_transparency_act.sponsored = true;
    } else {
        console.warn("Jeff Merkley (M001176) not found in scores!");
    }

    // Write back
    fs.writeFileSync(SCORES_PATH, JSON.stringify(scoresData, null, 2));
    console.log(`Updated ${updatedCount} Senators with 'cosponsored': true.`);
    if (unmatched.length > 0) {
        console.log("Unmatched Names:", unmatched.join(', '));
    }

} catch (error) {
    console.error("Error:", error);
}
