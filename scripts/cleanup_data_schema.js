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

    // 1. Senate Cleanup: Remove discharge_petition
    let senateCleanupCount = 0;
    legislators.forEach(leg => {
        const bioguideId = leg.id.bioguide;
        const type = getLatestTermType(leg);

        if (type === 'sen') {
            const entry = scoresData.scores[bioguideId];
            if (entry && entry.epstein_transparency_act && entry.epstein_transparency_act.discharge_petition) {
                delete entry.epstein_transparency_act.discharge_petition;
                senateCleanupCount++;
            }
        }
    });
    console.log(`Removed 'discharge_petition' from ${senateCleanupCount} Senators.`);

    // 2. Global Cleanup: Remove score, status, rename notes -> summary
    // Helper to clean an entry
    function cleanEntry(entry) {
        if (entry.score !== undefined) delete entry.score;
        if (entry.status !== undefined) delete entry.status;

        if (entry.notes !== undefined) {
            entry.summary = entry.notes;
            delete entry.notes;
        }
    }

    // Clean specific scores
    let globalCleanupCount = 0;
    for (const id in scoresData.scores) {
        cleanEntry(scoresData.scores[id]);
        globalCleanupCount++;
    }
    console.log(`Cleaned schema for ${globalCleanupCount} legislator records.`);

    // Clean default
    if (scoresData.default) {
        cleanEntry(scoresData.default);
        console.log("Cleaned schema for 'default' entry.");
    }

    // Write back
    fs.writeFileSync(SCORES_PATH, JSON.stringify(scoresData, null, 2));
    console.log("Cleanup complete. Saved to epstein_scores.json.");

} catch (error) {
    console.error("Error:", error);
}
