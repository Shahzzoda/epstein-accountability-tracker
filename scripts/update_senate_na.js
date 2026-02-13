const fs = require('fs');
const path = require('path');

const LEGISLATORS_PATH = path.join(__dirname, '../public/data/current_legislators.json');
const SCORES_PATH = path.join(__dirname, '../public/data/epstein_scores.json');

try {
    console.log("Loading data...");
    const legislators = JSON.parse(fs.readFileSync(LEGISLATORS_PATH, 'utf8'));
    const scoresData = JSON.parse(fs.readFileSync(SCORES_PATH, 'utf8'));

    // Helper to get latest term type
    function getLatestTermType(leg) {
        if (!leg.terms || leg.terms.length === 0) return null;
        return leg.terms[leg.terms.length - 1].type; // 'rep' or 'sen'
    }

    let updatedCount = 0;

    legislators.forEach(leg => {
        const bioguideId = leg.id.bioguide;
        const type = getLatestTermType(leg);

        if (type === 'sen') {
            const entry = scoresData.scores[bioguideId];
            if (entry) {
                if (!entry.epstein_transparency_act) {
                    entry.epstein_transparency_act = {};
                }
                // Set to "NOT_APPLICABLE"
                entry.epstein_transparency_act.discharge_petition = "NOT_APPLICABLE";
                updatedCount++;
            }
        }
    });

    console.log(`Updated ${updatedCount} Senators with 'discharge_petition': 'NOT_APPLICABLE'.`);

    // Write back
    fs.writeFileSync(SCORES_PATH, JSON.stringify(scoresData, null, 2));
    console.log("Saved to epstein_scores.json.");

} catch (error) {
    console.error("Error:", error);
}
