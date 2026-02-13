const fs = require('fs');
const path = require('path');

const SOC_PATH = path.join(__dirname, '../public/data/legislators/legislators_social_media.json');
const SCORE_PATH = path.join(__dirname, '../public/data/epstein_scores.json');

function ingestSocials() {
    console.log("Loading data files...");
    const socialData = JSON.parse(fs.readFileSync(SOC_PATH, 'utf8'));
    const scoreData = JSON.parse(fs.readFileSync(SCORE_PATH, 'utf8'));

    let updatedCount = 0;

    // Create a map of Bioguide ID -> Social Data for faster lookup
    const socialMap = {};
    socialData.forEach(entry => {
        if (entry.id && entry.id.bioguide) {
            socialMap[entry.id.bioguide] = entry.social;
        }
    });

    console.log(`Loaded social data for ${Object.keys(socialMap).length} legislators.`);

    // Iterate through scores and update
    for (const bioguideId in scoreData.scores) {
        if (socialMap[bioguideId]) {
            scoreData.scores[bioguideId].social = socialMap[bioguideId];
            updatedCount++;
        }
    }

    // Write back to file
    fs.writeFileSync(SCORE_PATH, JSON.stringify(scoreData, null, 2));
    console.log(`✅ Updated social media links for ${updatedCount} legislators.`);
}

ingestSocials();
