const fs = require('fs');
const path = require('path');

const LEGISLATORS_PATH = path.join(__dirname, '../public/data/legislators/current_legislators.json');
const SCORES_PATH = path.join(__dirname, '../public/data/epstein_scores.json');

try {
    console.log('Loading data...');
    const legislators = JSON.parse(fs.readFileSync(LEGISLATORS_PATH, 'utf8'));
    const scoresData = JSON.parse(fs.readFileSync(SCORES_PATH, 'utf8'));

    const nameMap = {};
    legislators.forEach(leg => {
        if (leg.id && leg.id.bioguide) {
            // Some might not have official_full, fallback to First Last
            nameMap[leg.id.bioguide] = leg.name.official_full || `${leg.name.first} ${leg.name.last}`;
        }
    });

    let updatedCount = 0;
    for (const [id, score] of Object.entries(scoresData.scores)) {
        if (nameMap[id]) {
            // Add official_full to the score object
            // To make it appear at the top, we can reconstruct the object if strictly needed, 
            // but JSON order isn't guaranteed. Usually prepending works in V8.
            const newScore = {
                official_full: nameMap[id],
                ...score
            };
            scoresData.scores[id] = newScore;
            updatedCount++;
        } else {
            console.warn(`No name found for ID: ${id}`);
        }
    }

    fs.writeFileSync(SCORES_PATH, JSON.stringify(scoresData, null, 2));
    console.log(`Updated ${updatedCount} scores with official names.`);

} catch (err) {
    console.error('Error:', err);
}
