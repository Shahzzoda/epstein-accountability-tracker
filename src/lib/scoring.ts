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

export interface SocialMedia {
  twitter?: string;
  facebook?: string;
  youtube?: string;
  youtube_id?: string;
  instagram?: string;
  instagram_id?: number | string;
  twitter_id?: string | number;
}

export interface RawScoreEntry {
  score?: number;
  status?: string;
  summary?: string;
  epstein_transparency_act?: EpsteinTransparencyActions;
  committee_seat?: { title: string; committee: string; thomas_id?: string }[];
  social?: SocialMedia;
  public_pressure_score?: number;
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

  let score = 0;
  const reasons: string[] = [];

  const activeAdvocacy = (entry?.public_pressure_score ?? 0) >= 3.0;

  if (voteYes) {
    score += 2.0;
    reasons.push("supportive recorded vote");
  }

  if (signedPetition) {
    score += 1.0;
    reasons.push("signed discharge petition");
  }

  if (cosponsored) {
    score += 1.0;
    reasons.push("cosponsored disclosure bill");
  }

  if (sponsored) {
    score += 1.5;
    reasons.push("sponsored disclosure bill");
  }

  if (activeAdvocacy) {
    score += 1.0;
    reasons.push("active public advocacy");
  }

  if (voteNo) {
    score -= 1.0;
    reasons.push("recorded non-supportive vote");
  }

  // Cap at 3.0 if no active advocacy or legislative sponsorship
  if (!activeAdvocacy && !cosponsored && !sponsored) {
    score = Math.min(3.0, score);
  }

  score = Math.max(0, Math.min(5, score));
  score = roundOne(score);

  let status = "Minimal";
  if (score > 4.0) status = "Leading";
  else if (score > 3.0) status = "Supportive";
  else if (score > 2.0) status = "Minimal";
  else if (score > 1.0) status = "Limited";
  else status = "Opposed";

  const summary =
    reasons.length > 0
      ? `Calculated from tracked action set: ${reasons.join(", ")}.`
      : "Calculated from tracked action set: no pro-disclosure action is recorded in this dataset for this lawmaker.";

  return { score, status, summary };
}
