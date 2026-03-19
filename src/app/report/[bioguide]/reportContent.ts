export interface ReportEta {
  sponsored?: boolean;
  cosponsored?: boolean;
  signed?: 'yes' | 'no' | boolean | string;
  discharge_petition?: { signed?: boolean; date?: string | null } | 'NOT_APPLICABLE';
}

export interface ReportCopyContext {
  score: number;
  publicPressureScore?: number;
  hasOversightSeat: boolean;
  eta?: ReportEta;
}

export interface ReportActionRow {
  id: string;
  label: string;
  isPositive: boolean;
  message: string;
}

export interface ReportToneContent {
  tone: 'encourage' | 'mixed' | 'pressure';
  outreachTitle: string;
  outreachBody: string;
  contactAsk: string;
}

type ReportActionDefinition = {
  id: string;
  label: string;
  negativeLabel?: string | ((context: ReportCopyContext) => string);
  shouldShow?: (context: ReportCopyContext) => boolean;
  isPositive: (context: ReportCopyContext) => boolean;
  positiveText: string | ((context: ReportCopyContext) => string);
  negativeText: string | ((context: ReportCopyContext) => string);
};

function hasSignedPetition(eta?: ReportEta) {
  return Boolean(eta?.discharge_petition && eta.discharge_petition !== 'NOT_APPLICABLE' && eta.discharge_petition.signed);
}

function hasRecordedSupport(eta?: ReportEta) {
  return eta?.signed === 'yes' || eta?.signed === true;
}

function hasRecordedOpposition(eta?: ReportEta) {
  return eta?.signed === 'no' || eta?.signed === false;
}

function hasVisibleLeadershipAction(context: ReportCopyContext) {
  return Boolean(
    context.eta?.sponsored ||
    context.eta?.cosponsored ||
    hasSignedPetition(context.eta) ||
    (context.publicPressureScore ?? 0) >= 2.4
  );
}

function resolveCopy(
  value: string | ((context: ReportCopyContext) => string),
  context: ReportCopyContext
) {
  return typeof value === 'function' ? value(context) : value;
}

// Single source of truth for the report checklist and the wording users see.
export const REPORT_ACTION_DEFINITIONS: ReportActionDefinition[] = [
  {
    id: 'public-advocacy',
    label: 'Vocal on the Issue',
    negativeLabel: 'Needs to Be More Vocal on the Issue',
    shouldShow: (context) => context.publicPressureScore !== undefined,
    isPositive: (context) => (context.publicPressureScore ?? 0) >= 2.4,
    positiveText: 'They are speaking publicly through interviews, statements, social media, or floor remarks. That helps keep pressure on the issue and shows voters where they stand.',
    negativeText: 'They should use interviews, statements, social media, or floor remarks to speak publicly about this. Public communication helps keep pressure on the issue and shows voters where they stand.'
  },
  {
    id: 'oversight-leverage',
    label: 'Oversight committee leverage',
    shouldShow: (context) => context.hasOversightSeat,
    isPositive: (context) => context.hasOversightSeat && hasVisibleLeadershipAction(context),
    positiveText: 'This seat gives them direct ways to press agencies for records and answers, and they are using some of that power.',
    negativeText: 'This seat gives them direct ways to press agencies for records and answers. They should use hearings, letters, and investigations to force answers.'
  },
  {
    id: 'sponsored-legislation',
    label: 'Sponsored Epstein Files Transparency Act',
    negativeLabel: 'Did not sponsor the Epstein Files Transparency Act',
    isPositive: (context) => Boolean(context.eta?.sponsored),
    positiveText: 'Sponsoring a bill means taking the lead on it. They did that here, which is one of the clearest signs of active effort to move this issue forward.',
    negativeText: 'Sponsoring a bill means taking the lead on it. They have not done that here, even though it is one of the clearest ways to move this issue forward.'
  },
  {
    id: 'cosponsored-legislation',
    label: 'Cosponsored Epstein Files Transparency Act',
    negativeLabel: 'Did not cosponsor the Epstein Files Transparency Act',
    isPositive: (context) => Boolean(context.eta?.cosponsored),
    positiveText: 'Cosponsoring a bill means formally adding support to it. They did that here, which helps build momentum and show support in Congress.',
    negativeText: 'Cosponsoring a bill means formally adding support to it. They have not done that here, even though broader support helps build momentum in Congress.'
  },
  {
    id: 'discharge-petition',
    label: 'Signed discharge petition',
    negativeLabel: 'Did Not Sign Discharge Petition',
    shouldShow: (context) => context.eta?.discharge_petition !== 'NOT_APPLICABLE',
    isPositive: (context) => hasSignedPetition(context.eta),
    positiveText: 'A discharge petition is a way to try to force a floor vote when leadership blocks a bill. They signed it here. That shows they were willing to use one of the strongest tools available to push action forward.',
    negativeText: 'A discharge petition is a way to try to force a floor vote when leadership blocks a bill. They have not signed it here. It is one of the strongest tools members have to push action forward.'
  },
  {
    id: 'recorded-vote',
    label: 'Voted for Epstein Files Transparency Act',
    isPositive: (context) => hasRecordedSupport(context.eta),
    positiveText: 'The Epstein Files Transparency Act is what forced the DOJ to release the files. They voted for it here. It passed nearly unanimously, making this the bare minimum.',
    negativeText: (context) =>
      hasRecordedOpposition(context.eta)
        ? 'The Epstein Files Transparency Act is what forced the DOJ to release the files. They voted against it here. It passed nearly unanimously, making their opposition especially striking.'
        : 'A recorded vote is the clearest proof of where they stand. If this reaches the floor, they should support it.'
  }
];

const REPORT_TONE_COPY: Record<ReportToneContent['tone'], Omit<ReportToneContent, 'tone'>> = {
  encourage: {
    outreachTitle: 'Thank them for the pressure they have applied, then ask for follow-through',
    outreachBody: 'This office is taking meaningful steps. The strongest message now is to acknowledge that progress, insist that they keep using every tool available, and ask for clear public updates on what comes next.',
    contactAsk: 'Thank you for the work your office is doing on Epstein-file disclosure. Please keep pushing for full release of eligible records, explain the next steps you support, and provide a clear public timeline.'
  },
  mixed: {
    outreachTitle: 'Push for stronger follow-through',
    outreachBody: 'This office is taking some action, but the record is still incomplete. The most effective outreach is specific: point to what they are doing, then ask what they will do next and when.',
    contactAsk: 'I appreciate the steps your office is taking so far, but the record is still incomplete. Please strengthen your support for full release of eligible Epstein-file records, explain the next steps you support, and provide a clear timeline.'
  },
  pressure: {
    outreachTitle: 'Tell them they need to do better',
    outreachBody: 'There is still too little visible action on the public record. Direct constituent pressure matters most when it asks for specific commitments, written answers, and a public timetable.',
    contactAsk: 'Your office is not showing enough visible action on Epstein-file disclosure. Please support full release of eligible records, explain the exact steps you will take, and provide a clear public timeline.'
  }
};

export function buildReportActionRows(context: ReportCopyContext): ReportActionRow[] {
  return REPORT_ACTION_DEFINITIONS
    .filter((definition) => (definition.shouldShow ? definition.shouldShow(context) : true))
    .map((definition) => {
      const isPositive = definition.isPositive(context);
      return {
        id: definition.id,
        label: isPositive ? definition.label : resolveCopy(definition.negativeLabel ?? definition.label, context),
        isPositive,
        message: resolveCopy(isPositive ? definition.positiveText : definition.negativeText, context)
      };
    });
}

export function getReportToneContent(
  context: ReportCopyContext,
  actionRows: ReportActionRow[]
): ReportToneContent {
  const positiveCount = actionRows.filter((row) => row.isPositive).length;
  const tone: ReportToneContent['tone'] =
    positiveCount >= 3 || context.score >= 3.1
      ? 'encourage'
      : positiveCount >= 1 || context.score >= 1.1
        ? 'mixed'
        : 'pressure';

  return {
    tone,
    ...REPORT_TONE_COPY[tone]
  };
}
