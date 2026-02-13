const fs = require('fs');
const path = require('path');

const LEGISLATORS_PATH = path.join(__dirname, '../public/data/current_legislators.json');
const SCORES_PATH = path.join(__dirname, '../public/data/epstein_scores.json');

try {
    console.log("Loading data...");
    const legislators = JSON.parse(fs.readFileSync(LEGISLATORS_PATH, 'utf8'));
    const scoresData = JSON.parse(fs.readFileSync(SCORES_PATH, 'utf8'));

    let updatedCount = 0;

    // Helper to get latest term type
    function getLatestTermType(leg) {
        if (!leg.terms || leg.terms.length === 0) return null;
        return leg.terms[leg.terms.length - 1].type; // 'rep' or 'sen'
    }

    legislators.forEach(leg => {
        const bioguideId = leg.id.bioguide;
        const type = getLatestTermType(leg);

        if (type === 'sen') {
            // Ensure score entry exists
            if (!scoresData.scores[bioguideId]) {
                scoresData.scores[bioguideId] = { ...scoresData.default };
            }

            // Ensure eta section exists
            if (!scoresData.scores[bioguideId].epstein_transparency_act) {
                scoresData.scores[bioguideId].epstein_transparency_act = {};
            }

            // Update signed status
            // Only update if not already explicitly set to something else? 
            // User requested change/add "signed": "yes". 
            // We'll overwrite to be sure.
            scoresData.scores[bioguideId].epstein_transparency_act.signed = "yes";
            updatedCount++;
        }
    });

    // Write back
    fs.writeFileSync(SCORES_PATH, JSON.stringify(scoresData, null, 2));
    console.log(`Updated ${updatedCount} Senators with 'signed': 'yes'.`);

} catch (error) {
    console.error("Error:", error);
}
