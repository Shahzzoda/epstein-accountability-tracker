import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import ShareButton from '@/components/ShareButton';
import ReportContactCard from '@/components/ReportContactCard';
import LegislatorAvatar from '@/components/LegislatorAvatar';
import SocialLinks from '@/components/SocialLinks';
import { calculateEpsteinScore } from '@/lib/scoring';

interface Term {
  type: string;
  start: string;
  end: string;
  state: string;
  district?: number;
  party: string;
  url?: string;
  address?: string;
  phone?: string;
  contact_form?: string;
}

interface Legislator {
  id: { bioguide: string };
  name: { official_full: string };
  terms: Term[];
}

interface CommitteeMember {
  name: string;
  party: string;
  rank: number;
  title?: string;
  bioguide: string;
}

interface CommitteeInfo {
  type: string;
  name: string;
  url: string;
  thomas_id: string;
  house_committee_id?: string;
  senate_committee_id?: string;
  jurisdiction?: string;
}

interface CommitteeMembershipData {
  [key: string]: CommitteeMember[];
}

interface CommitteeSeat {
  title: string;
  committee: string;
  thomas_id: string;
}

interface ScoreEntry {
  score?: number;
  status?: string;
  summary?: string;
  public_pressure_score?: number;
  epstein_transparency_act?: {
    sponsored?: boolean;
    cosponsored?: boolean;
    cosponsored_date?: string | null;
    signed?: 'yes' | 'no' | boolean | string;
    discharge_petition?: { signed?: boolean; date?: string | null } | "NOT_APPLICABLE";
  };
  committee_seat?: CommitteeSeat[];
  social?: {
    twitter?: string;
    facebook?: string;
    youtube?: string;
    instagram?: string;
  };
}

interface ScoreFile {
  scores?: Record<string, ScoreEntry>;
  default?: ScoreEntry;
}

interface DataVersionInfo {
  asOf: string;
  datasetHash: string;
}

interface ReportData {
  legislator: Legislator;
  score: ScoreEntry;
  version: DataVersionInfo;
  stateSummary: {
    state: string;
    lawmakers: number;
    averageScore: number;
    supportiveActions: number;
    possibleActions: number;
  };
}

function ArrowSignal({ up }: { up: boolean }) {
  return up ? (
    <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 3l6 8h-4v6H8v-6H4l6-8z" />
    </svg>
  ) : (
    <svg className="h-5 w-5 text-rose-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 17l-6-8h4V3h4v6h4l-6 8z" />
    </svg>
  );
}

function formatUtcDate(date: Date) {
  const formatted = date.toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC'
  });
  return `${formatted} UTC`;
}

function countSupportiveActions(entry: ScoreEntry): number {
  const eta = entry.epstein_transparency_act;
  if (!eta) return 0;

  let total = 0;
  if (eta.sponsored) total += 1;
  if (eta.cosponsored) total += 1;
  if (eta.discharge_petition && eta.discharge_petition !== "NOT_APPLICABLE" && eta.discharge_petition.signed) total += 1;
  if (eta.signed === 'yes' || eta.signed === true) total += 1;
  return total;
}

async function getReportData(bioguide: string): Promise<ReportData | null> {
  const legislatorPath = path.join(process.cwd(), 'public', 'data/legislators/current_legislators.json');
  const scorePath = path.join(process.cwd(), 'public', 'data/epstein_scores.json');

  const [legislatorRaw, scoreRaw, legislatorStat, scoreStat] = await Promise.all([
    readFile(legislatorPath, 'utf8'),
    readFile(scorePath, 'utf8'),
    stat(legislatorPath),
    stat(scorePath)
  ]);

  const legislators = JSON.parse(legislatorRaw) as Legislator[];
  const scoreFile = JSON.parse(scoreRaw) as ScoreFile;

  const legislator = legislators.find((entry) => entry.id.bioguide === bioguide);
  if (!legislator) return null;

  const score = scoreFile.scores?.[bioguide] || scoreFile.default;
  if (!score) return null;
  const currentTerm = legislator.terms[legislator.terms.length - 1];
  const sameState = legislators.filter((entry) => {
    const term = entry.terms[entry.terms.length - 1];
    return term.state === currentTerm.state && (term.type === 'sen' || term.type === 'rep');
  });
  const scoredEntries = sameState.map((entry) => scoreFile.scores?.[entry.id.bioguide] || scoreFile.default).filter(Boolean) as ScoreEntry[];
  const scoreTotal = scoredEntries.reduce((sum, entry) => sum + calculateEpsteinScore(entry).score, 0);
  const supportiveActions = scoredEntries.reduce((sum, entry) => sum + countSupportiveActions(entry), 0);
  const averageScore = scoredEntries.length ? scoreTotal / scoredEntries.length : 0;

  const datasetHash = createHash('sha256').update(legislatorRaw).update(scoreRaw).digest('hex').slice(0, 12);
  const newestMtime = Math.max(legislatorStat.mtimeMs, scoreStat.mtimeMs);

  return {
    legislator,
    score,
    stateSummary: {
      state: currentTerm.state,
      lawmakers: scoredEntries.length,
      averageScore,
      supportiveActions,
      possibleActions: scoredEntries.length * 4
    },
    version: {
      asOf: formatUtcDate(new Date(newestMtime)),
      datasetHash
    }
  };
}

export async function generateMetadata({ params }: { params: Promise<{ bioguide: string }> }): Promise<Metadata> {
  const { bioguide } = await params;
  const reportData = await getReportData(bioguide);

  if (!reportData) {
    return {
      title: 'Official Profile Report | Accountability Record: Epstein-Related Exploitation',
      description: 'Open an official profile report and review tracked public-record actions linked to Epstein files.'
    };
  }

  const currentTerm = reportData.legislator.terms[reportData.legislator.terms.length - 1];
  const calculated = calculateEpsteinScore(reportData.score);
  const title = `${reportData.legislator.name.official_full} Report | Accountability Record: Epstein-Related Exploitation`;
  const description = `${reportData.legislator.name.official_full} (${currentTerm.party}) score: ${calculated.score.toFixed(1)}/5, based on tracked public-record actions. Not an allegation of criminal conduct.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: [
        {
          url: '/og-report.svg',
          width: 1200,
          height: 630,
          alt: 'Accountability Record: Epstein-Related Exploitation share image'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-report.svg']
    }
  };
}

export default async function ReportPage({
  params,
  searchParams
}: {
  params: Promise<{ bioguide: string }>;
  searchParams: Promise<{ district?: string; stateFips?: string }>;
}) {
  const { bioguide } = await params;
  const { district, stateFips } = await searchParams;
  const reportData = await getReportData(bioguide);

  if (!reportData) {
    notFound();
  }

  const { legislator, score, stateSummary } = reportData;
  const calculated = calculateEpsteinScore(score);
  const currentTerm = legislator.terms[legislator.terms.length - 1];
  const eta = score.epstein_transparency_act;
  const scoreColor = calculated.score > 3.0 ? 'text-emerald-700' : calculated.score > 2.0 ? 'text-amber-700' : 'text-rose-700';

  // Sort committees by priority: Chair > Ranking > Vice > Member
  const displayCommittees = (score.committee_seat || [])
    .sort((a, b) => {
      const getPriority = (t: string) => {
        if (t.includes('Chair') || t.includes('Chairman')) return 0;
        if (t.includes('Ranking')) return 1;
        if (t.includes('Vice')) return 2;
        return 3;
      };
      return getPriority(a.title) - getPriority(b.title);
    });

  const actionRows = [
    {
      label: 'Public advocacy',
      isPositive: (score.public_pressure_score ?? 0) >= 3.0,
      context: 'This office needs to create visible public pressure around the case. Public pressure raises the cost of delay and helps force DOJ follow-through.',
      hidden: score.public_pressure_score === undefined
    },
    {
      label: 'Sponsored release legislation',
      isPositive: Boolean(eta?.sponsored),
      context: 'Leading by introducing the bill is the strongest early signal that they are willing to drive accountability in law.',
      hidden: !eta?.sponsored
    },
    {
      label: 'Cosponsored release legislation',
      isPositive: Boolean(eta?.cosponsored),
      context: 'Formally backing the bill as a cosponsor helps build the coalition needed to move disclosure legislation.',
      hidden: false
    },
    {
      label: 'Signed discharge petition',
      isPositive: Boolean(eta?.discharge_petition && eta?.discharge_petition !== 'NOT_APPLICABLE' && eta?.discharge_petition.signed),
      context: 'Signing the petition can force a House vote when leadership blocks floor action.',
      hidden: eta?.discharge_petition === 'NOT_APPLICABLE'
    },
    {
      label: 'Recorded vote support',
      isPositive: eta?.signed === 'yes' || eta?.signed === true,
      context: 'Their final vote (or Senate passage support) is an on-the-record position on Epstein-file disclosure.',
      hidden: false
    }
  ]
    .filter(row => !row.hidden)
    .sort((a, b) => (a.isPositive === b.isPositive ? 0 : a.isPositive ? -1 : 1));

  const supportiveCount = actionRows.filter((row) => row.isPositive).length;
  const isSupportiveProfile = supportiveCount >= 3;
  const isMixedProfile = supportiveCount > 0 && supportiveCount < 3;
  const templateMode = isSupportiveProfile ? 'supportive' : isMixedProfile ? 'mixed' : 'not_recorded';

  const backHref = district && stateFips ? `/results?district=${district}&stateFips=${stateFips}` : '/results';

  return (
    <main className="startup-shell min-h-screen px-4 py-4 sm:px-6 sm:py-5">
      <article className="mx-auto w-full max-w-[960px] space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
          <Link href={backHref} className="text-sm font-semibold text-[var(--brand-blue)] hover:underline">
            &larr; Back
          </Link>
          <ShareButton
            label="Copy link"
            className="text-sm font-semibold text-[var(--brand-blue)] hover:underline"
          />
        </div>

        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full border border-[var(--border)] bg-slate-100">
              <LegislatorAvatar
                bioguide={legislator.id.bioguide}
                alt={legislator.name.official_full}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl leading-tight text-slate-900 sm:text-4xl">{legislator.name.official_full}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                <p>
                  {currentTerm.type === 'sen' ? `United States Senator (${currentTerm.state})` : `U.S. Representative (${currentTerm.state}-${currentTerm.district})`} · {currentTerm.party}
                </p>
                {score.social && (
                  <>
                    <span>·</span>
                    <SocialLinks socials={score.social} />
                  </>
                )}
              </div>

              {/* Committee Badges */}
              {displayCommittees.length > 0 && (
                <div className="mt-4 flex flex-col gap-3">
                  {displayCommittees.map((c, i) => {
                    const contextText = {
                      'HSJU': 'Primary oversight of the Department of Justice and FBI. Has the power to subpoena Attorney General records, conduct impeachment hearings, and oversee constitutional rights.',
                      'SSJU': 'Primary oversight of the Department of Justice and FBI. Handles confirmation of judges and Attorney General. Has power to subpoena DOJ records.',
                      'HSGO': 'The main investigative body of Congress with broad subpoena power to investigate executive branch misconduct, including at the DOJ and intelligence agencies.',
                      'SSGA': 'The Senate\'s primary oversight committee with broad jurisdiction over government operations and the Department of Homeland Security. Can investigate agency mismanagement.',
                      'HLIG': 'Oversees the intelligence community (CIA, NSA, FBI) and holds the power to declassify information related to national security and intelligence failures.',
                      'SLIN': 'Oversees the intelligence community and can investigate intelligence failures. Has power to review covert actions and budget.',
                      'HSAP': 'Controls the "power of the purse." Can withhold funding from specific DOJ investigations or officials to force accountability and transparency.',
                      'SSAP': 'Controls federal spending. Can leverage funding decisions to demand accountability and transparency from the DOJ and other agencies.',
                      'HSRU': 'The "Speaker\'s Committee" that determines which bills reach the floor and under what rules, critical for forcing votes on transparency legislation.',
                      'SSRA': 'Oversees Senate rules and procedures. Critical for determining how transparency legislation moves through the chamber.',
                      'HSAS': 'Oversees the Department of Defense. Can demand accountability for military intelligence activities and executive branch national security decisions.',
                      'SSAS': 'Oversees the Department of Defense. Holds confirmation power over military leadership and can investigate national security failures.',
                      'HSFA': 'Oversees the State Department and foreign policy. Can investigate executive branch diplomatic conduct and international agreements.',
                      'SSFR': 'Oversees foreign policy and treaties. Holds confirmation power over State Department officials and can investigate diplomatic failures.',
                      'HSHM': 'Oversees the Department of Homeland Security. Can investigate border security failures and executive branch homeland security actions.',
                      'HSWM': 'The chief tax-writing committee. Has unique authority to request tax returns and oversee Treasury Department enforcement actions.',
                      'SSFI': 'Oversees taxation, trade, and health programs. Has jurisdiction over the Treasury Department and can investigate financial misconduct.',
                      'HSIF': 'Oversees healthcare, energy, and telecommunications. Can investigate executive branch regulatory overreach and agency failures in these critical sectors.',
                      'SSCM': 'Oversees commerce, science, and transportation. Can investigate executive branch regulatory actions and agency conduct in these areas.',
                      'SSBU': 'Responsible for drafting the budget plan. Can highlight executive branch spending inefficiencies and demand fiscal responsibility.',
                      'HSBU': 'Responsible for drafting the budget usage. Can highlight executive branch spending inefficiencies and demand fiscal responsibility.'
                    }[c.thomas_id] || '';

                    return (
                      <div key={i} className="group relative flex w-fit cursor-help flex-wrap items-center gap-2.5">
                        <div className="relative inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3.5 py-1.5 text-sm font-bold text-amber-900 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-inset ring-amber-600/20 backdrop-blur-sm transition-all hover:bg-amber-100 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                          {c.title && c.title !== 'Member' && (
                            <span className="opacity-90">{c.title} of the</span>
                          )}
                          <span>{c.committee}</span>
                        </div>

                        {/* Hover Tooltip (Custom Modal) */}
                        {contextText && (
                          <div className="absolute bottom-full left-1/2 z-50 mb-3 w-72 -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 pointer-events-none">
                            <div className="relative rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-xl">
                              <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-600">High Leverage</h4>
                              <p className="text-sm leading-relaxed text-amber-900">
                                {contextText}
                              </p>
                              {/* Arrow */}
                              <div className="absolute left-1/2 top-full -mt-2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-amber-200 bg-amber-50"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700">Score</p>
            <p className={`text-4xl font-black ${scoreColor}`}>
              {calculated.score.toFixed(1)}
              <span className="ml-1 text-base font-semibold text-slate-500">/5</span>
            </p>
          </div>
        </header>

        <section className="space-y-3">

          {score.summary ? (
            <p className="text-base leading-relaxed text-slate-800">
              {score.summary}
            </p>
          ) : (
            <p className="text-sm italic text-slate-500">
              We do not yet have an independent summary for {legislator.name.official_full}'s actions regarding the Epstein case.
            </p>
          )}


        </section>

        <section className="space-y-2 pb-2">
          <h2 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">How Are They Doing On Accountability?</h2>
          <p className="text-sm text-slate-700">
            We check concrete actions tied to Epstein-file disclosure and DOJ accountability, and explain why each action helps or hurts public oversight.
          </p>
          <div className="mt-3 space-y-2">
            {actionRows.map((row) => (
              <div key={row.label} className="flex items-center gap-2 py-1">
                <ArrowSignal up={row.isPositive} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                  <p className="text-sm text-slate-600">{row.context}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-1">
          <h2 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">Unhappy with how your representative is handling this?</h2>
          <p className="text-sm text-slate-700">
            Consistent constituent pressure matters. Offices respond when voters ask for clear timelines, written answers, and public accountability.
            Ask for a written response on Epstein-file disclosure steps + timeline.
          </p>
        </section>

        <ReportContactCard
          officialName={legislator.name.official_full}
          officeLabel={currentTerm.type === 'sen' ? 'Senator' : 'Representative'}
          phone={currentTerm.phone}
          website={currentTerm.url}
          address={currentTerm.address}
          contactForm={currentTerm.contact_form}
          templateMode={templateMode}
        />

        <footer className="border-t border-[var(--border)] pt-4 text-center">
          <Link href="/epstein-files" className="text-xs font-semibold text-[var(--brand-blue)] hover:underline">
            How scoring works
          </Link>
        </footer>
      </article>
    </main>
  );
}
