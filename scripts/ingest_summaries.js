
const fs = require('node:fs/promises');
const path = require('node:path');

const SUMMARY_PATH = path.join(process.cwd(), 'public/data/legislators/codex_summaries.json');
const SCORES_PATH = path.join(process.cwd(), 'public/data/epstein_scores.json');

async function main() {
    try {
        console.log('Reading data...');
        const [summaryData, scoresData] = await Promise.all([
            fs.readFile(SUMMARY_PATH, 'utf-8'),
            fs.readFile(SCORES_PATH, 'utf-8')
        ]);

        const summaries = JSON.parse(summaryData);
        const scores = JSON.parse(scoresData);

        let updatedCount = 0;
        const missing = [];

        // Iterate through summaries and update scores
        for (const [bioguideId, summaryText] of Object.entries(summaries)) {
            if (scores.scores[bioguideId]) {
                scores.scores[bioguideId].summary = summaryText;
                updatedCount++;
            } else {
                missing.push(bioguideId);
            }
        }

        console.log(`Updated summaries for ${updatedCount} legislators.`);
        if (missing.length > 0) {
            console.log(`Warning: ${missing.length} legislators from summary file not found in scores file.`);
            // console.log('Missing IDs:', missing.join(', '));
        }

        console.log('Writing updated scores to file...');
        await fs.writeFile(SCORES_PATH, JSON.stringify(scores, null, 2));
        console.log('Done!');

    } catch (error) {
        console.error('Error during ingestion:', error);
        process.exit(1);
    }
}

main();
