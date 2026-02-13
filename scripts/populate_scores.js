const fs = require('fs');
const path = require('path');

const LEGISLATORS_PATH = path.join(__dirname, '../public/data/legislators/current_legislators.json');
const SCORES_PATH = path.join(__dirname, '../public/data/epstein_scores.json');

// Default score object
const DEFAULT_SCORE = {
    score: 2.5,
    status: "Unknown",
    notes: "We do not yet have specific data on this legislator's actions regarding the Epstein case. The default score of 2.5 indicates 'Unknown/Baseline'."
};

// Mock overrides (optional, to keep for testing)
const MOCK_OVERRIDES = {
    "S000148": { // Chuck Schumer (Actually S000148 is Schumer, wait. Let's verify IDs again. S000148 is Schumer. G000555 is Gillibrand.)
        score: 0.5,
        status: "Bad",
        notes: "Mock Data: Voted against transparency measures."
    },
    "G000555": { // Kirsten Gillibrand
        score: 4.5,
        status: "Good",
        notes: "Mock Data: Strong advocate for transparency."
    }
};

try {
    console.log(`Reading legislators from ${LEGISLATORS_PATH}...`);
    const legislatorsRaw = fs.readFileSync(LEGISLATORS_PATH, 'utf8');
    const legislators = JSON.parse(legislatorsRaw);
    console.log(`Found ${legislators.length} legislators.`);

    const scoresData = {
        default: DEFAULT_SCORE,
        scores: {}
    };

    let count = 0;
    legislators.forEach(leg => {
        const bioguideId = leg.id?.bioguide;
        if (bioguideId) {
            // Use override if exists, otherwise default
            scoresData.scores[bioguideId] = MOCK_OVERRIDES[bioguideId] || DEFAULT_SCORE;
            count++;
        } else {
            console.warn(`Warning: Legislator ${leg.name?.official_full} has no Bioguide ID.`);
        }
    });

    console.log(`Generated scores for ${count} legislators.`);

    fs.writeFileSync(SCORES_PATH, JSON.stringify(scoresData, null, 2));
    console.log(`Successfully wrote to ${SCORES_PATH}`);

    // Verification
    const writtenRaw = fs.readFileSync(SCORES_PATH, 'utf8');
    const writtenData = JSON.parse(writtenRaw);
    const writtenCount = Object.keys(writtenData.scores).length;

    if (writtenCount === count) {
        console.log(`Verification PASSED: ${writtenCount} entries found in output file.`);
    } else {
        console.error(`Verification FAILED: Expected ${count}, found ${writtenCount}.`);
    }

} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
