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
  election?: {
    up_for_election_2026?: boolean;
    next_election_year?: number | null;
    current_term_end?: string | null;
    source?: string;
  };
}

export interface CalculatedScore {
  score: number;
  status: string;
  summary: string;
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function parseActionDate(raw?: string | null) {
  if (!raw) return null;
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const [, month, day, year] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

function hasRelevantOversightSeat(entry?: RawScoreEntry) {
  const seats = entry?.committee_seat ?? [];
  if (seats.length === 0) {
    return { relevant: false, leadership: false };
  }

  const committeePattern = /(judiciary|oversight|governmental affairs|government reform|homeland security|intelligence|ethics|investigations)/i;
  const leadershipPattern = /(chair|chairman|ranking|vice)/i;

  const relevantSeats = seats.filter((seat) => committeePattern.test(seat.committee));
  return {
    relevant: relevantSeats.length > 0,
    leadership: relevantSeats.some((seat) => leadershipPattern.test(seat.title))
  };
}

function getPublicPressureContribution(value?: number) {
  const pressure = value ?? 0;

  if (pressure >= 3.5) return { points: 1.2, reason: "sustained public advocacy" };
  if (pressure >= 3.0) return { points: 1.0, reason: "active public advocacy" };
  if (pressure >= 2.4) return { points: 0.6, reason: "visible public advocacy" };
  if (pressure >= 1.7) return { points: 0.3, reason: "limited public engagement" };

  return { points: 0, reason: "" };
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
  const pressure = entry?.public_pressure_score ?? 0;
  const pressureContribution = getPublicPressureContribution(pressure);
  const oversightSeat = hasRelevantOversightSeat(entry);
  const cosponsoredDate = parseActionDate(actions?.cosponsored_date);
  const petitionDate =
    actions?.discharge_petition && actions.discharge_petition !== "NOT_APPLICABLE"
      ? parseActionDate(actions.discharge_petition.date)
      : null;
  const visibleLeadershipAction = sponsored || cosponsored || signedPetition || pressure >= 2.4;

  let score = 0;
  const reasons: string[] = [];

  if (voteYes) {
    score += 1.5;
    reasons.push("supportive recorded vote");
  }

  if (signedPetition) {
    score += 1.2;
    reasons.push("signed discharge petition");
  }

  if (cosponsored) {
    score += 1.0;
    reasons.push("cosponsored disclosure bill");
  }

  if (sponsored) {
    score += 1.7;
    reasons.push("sponsored disclosure bill");
  }

  if (sponsored && signedPetition) {
    score += 0.8;
    reasons.push("combined bill sponsorship with discharge pressure");
  }

  if (cosponsoredDate) {
    const firstMoverCutoff = Date.UTC(2025, 6, 23);
    const earlyMoverCutoff = Date.UTC(2025, 6, 31);
    const cosponsoredTime = cosponsoredDate.getTime();

    if (cosponsoredTime <= firstMoverCutoff) {
      score += 0.4;
      reasons.push("early legislative commitment");
    } else if (cosponsoredTime <= earlyMoverCutoff) {
      score += 0.2;
      reasons.push("fairly early legislative commitment");
    }
  }

  if (petitionDate) {
    const petitionLaunchCutoff = Date.UTC(2025, 8, 3);
    if (petitionDate.getTime() <= petitionLaunchCutoff) {
      score += 0.2;
      reasons.push("early discharge pressure");
    }
  }

  if (pressureContribution.points > 0) {
    score += pressureContribution.points;
    reasons.push(pressureContribution.reason);
  }

  if (oversightSeat.relevant && visibleLeadershipAction) {
    score += oversightSeat.leadership ? 0.7 : 0.4;
    reasons.push(oversightSeat.leadership ? "used committee leadership leverage" : "used oversight committee leverage");
  } else if (oversightSeat.relevant && !visibleLeadershipAction && pressure < 1.7) {
    score -= oversightSeat.leadership ? 0.6 : 0.3;
    reasons.push(oversightSeat.leadership ? "oversight leadership without visible pressure" : "oversight seat without visible pressure");
  }

  if (entry?.election?.up_for_election_2026 && !visibleLeadershipAction && pressure < 1.7) {
    score -= 0.2;
    reasons.push("limited visible accountability in an election cycle");
  }

  if (voteNo) {
    score -= 2.0;
    reasons.push("recorded non-supportive vote");
  }

  // Members who only took a low-cost final vote should not reach high tiers.
  if (!visibleLeadershipAction) {
    score = Math.min(2.6, score);
  } else if (!sponsored && !cosponsored && !signedPetition && pressure < 3.0) {
    score = Math.min(3.6, score);
  }

  // A perfect score requires the top public-advocacy tier, not just procedural support.
  if (pressure < 3.5) {
    score = Math.min(4.7, score);
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
