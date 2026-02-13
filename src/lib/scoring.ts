export interface EpsteinTransparencyActions {
  sponsored?: boolean;
  cosponsored?: boolean;
  cosponsored_date?: string | null;
  signed?: "yes" | "no" | boolean | string;
  discharge_petition?:
  | {
    signed?: boolean;
    date?: string | null;
  }
  | "NOT_APPLICABLE";
}

export interface RawScoreEntry {
  score?: number;
  status?: string;
  summary?: string;
  epstein_transparency_act?: EpsteinTransparencyActions;
}

export interface CalculatedScore {
  score: number;
  status: string;
  summary: string;
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

export function calculateEpsteinScore(entry?: RawScoreEntry): CalculatedScore {
  const actions = entry?.epstein_transparency_act;
  const voteYes = actions?.signed === "yes" || actions?.signed === true;
  const voteNo = actions?.signed === "no" || actions?.signed === false;

  // Handle discharge petition safely
  let signedPetition = false;
  if (actions?.discharge_petition && actions.discharge_petition !== "NOT_APPLICABLE") {
    signedPetition = Boolean(actions.discharge_petition.signed);
  }

  const cosponsored = Boolean(actions?.cosponsored);
  const sponsored = Boolean(actions?.sponsored);

  let score = 1.0;
  const reasons: string[] = [];

  if (voteYes) {
    score += 1.7;
    reasons.push("supportive recorded vote");
  }
  if (signedPetition) {
    score += 1.2;
    reasons.push("signed discharge petition");
  }
  if (cosponsored) {
    score += 0.8;
    reasons.push("cosponsored disclosure bill");
  }
  if (sponsored) {
    score += 1.3;
    reasons.push("sponsored disclosure bill");
  }
  if (voteNo) {
    score -= 0.8;
    reasons.push("recorded non-supportive vote");
  }

  score = Math.max(0, Math.min(5, score));
  score = roundOne(score);

  let status = "Minimal";
  if (score >= 4.2) status = "Leading";
  else if (score >= 3.2) status = "Supportive";
  else if (score >= 2.2) status = "Limited";
  else if (score < 1) status = "Opposed";

  const summary =
    reasons.length > 0
      ? `Calculated from tracked action set: ${reasons.join(", ")}.`
      : "Calculated from tracked action set: no pro-disclosure action is recorded in this dataset for this lawmaker.";

  return { score, status, summary };
}
