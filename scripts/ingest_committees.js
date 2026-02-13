const fs = require('fs');
const path = require('path');

const COMMITTEES_PATH = path.join(__dirname, '../public/data/committee_membership_current.json');
const LEGISLATORS_PATH = path.join(__dirname, '../public/data/legislators/current_legislators.json');
const SCORES_PATH = path.join(__dirname, '../public/data/epstein_scores.json');

const TARGET_COMMITTEES = {
    "HSJU": "House Judiciary Committee",
    "HSGO": "House Oversight Committee",
    "SSJU": "Senate Judiciary Committee"
};

try {
    console.log('Loading data...');
    const committeesData = JSON.parse(fs.readFileSync(COMMITTEES_PATH, 'utf8'));
    let scoresData = JSON.parse(fs.readFileSync(SCORES_PATH, 'utf8'));

    // Reset committee_seat for all scores first to avoid stale data if re-run
    for (const id in scoresData.scores) {
        if (scoresData.scores[id].committee_seat) {
            delete scoresData.scores[id].committee_seat;
        }
    }

    let updatedCount = 0;
    const updatedIds = new Set();

    for (const [thomasId, committeeName] of Object.entries(TARGET_COMMITTEES)) {
        const members = committeesData[thomasId];
        if (!members) {
            console.warn(`Warning: No data found for committee ${thomasId}`);
            continue;
        }

        members.forEach(member => {
            const bioguideId = member.bioguide;
            if (!bioguideId) return;

            // Initialize score object if needed (though it should exist)
            if (!scoresData.scores[bioguideId]) {
                // If they are on a committee but not in our scores list (rare but possible if scores list is outdated), skip or warn?
                // For now, let's skip/warn as we expect scores to cover everyone.
                console.warn(`Legislator ${bioguideId} (${member.name}) on ${thomasId} not found in scores file.`);
                return;
            }

            if (!scoresData.scores[bioguideId].committee_seat) {
                scoresData.scores[bioguideId].committee_seat = [];
            }

            const seatInfo = {
                title: member.title || "Member",
                committee: committeeName,
                thomas_id: thomasId
            };

            scoresData.scores[bioguideId].committee_seat.push(seatInfo);
            updatedIds.add(bioguideId);
        });
    }

    fs.writeFileSync(SCORES_PATH, JSON.stringify(scoresData, null, 2));
    console.log(`Updated ${updatedIds.size} legislators with committee seats.`);

} catch (err) {
    console.error('Error:', err);
}
