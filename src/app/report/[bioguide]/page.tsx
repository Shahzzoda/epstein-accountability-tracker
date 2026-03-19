import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createHash } from 'node:crypto';
import ShareButton from '@/components/ShareButton';
import ReportContactCard from '@/components/ReportContactCard';
import LegislatorAvatar from '@/components/LegislatorAvatar';
import SocialLinks from '@/components/SocialLinks';
import VoterActionCard from '@/components/VoterActionCard';
import CommitteeBadges, { type CommitteeSeat } from '@/components/CommitteeBadges';
import { calculateEpsteinScore } from '@/lib/scoring';
import { buildReportActionRows, getReportToneContent } from './reportContent';

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

interface ScoreEntry {
  score?: number;
  status?: string;
  summary?: string;
  public_pressure_score?: number;
  election?: {
    up_for_election_2026?: boolean;
    next_election_year?: number | null;
    current_term_end?: string | null;
  };
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

function StatusDot({ positive }: { positive: boolean }) {
  return (
    <span
      className={`mt-1 h-3 w-3 flex-none rounded-full ${positive ? 'bg-emerald-600' : 'bg-rose-600'}`}
      aria-hidden="true"
    />
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

function hasRelevantOversightSeat(seats: CommitteeSeat[] = []) {
  return seats.some((seat) => /(judiciary|oversight|governmental affairs|government reform|homeland security|intelligence|ethics|investigations)/i.test(seat.committee));
}

function getPublicBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }
  return 'https://rep-finder.shahzoda01.workers.dev';
}

async function getReportData(bioguide: string): Promise<ReportData | null> {
  const baseUrl = getPublicBaseUrl();
  const [legislatorRes, scoreRes] = await Promise.all([
    fetch(`${baseUrl}/data/legislators/current_legislators.json`, { cache: 'force-cache' }),
    fetch(`${baseUrl}/data/epstein_scores.json`, { cache: 'force-cache' })
  ]);

  if (!legislatorRes.ok || !scoreRes.ok) {
    throw new Error('Failed to load report datasets');
  }

  const [legislatorRaw, scoreRaw] = await Promise.all([
    legislatorRes.text(),
    scoreRes.text()
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
  const legislatorLastModified = Date.parse(legislatorRes.headers.get('last-modified') || '');
  const scoreLastModified = Date.parse(scoreRes.headers.get('last-modified') || '');
  const newestMtime = Math.max(
    Number.isNaN(legislatorLastModified) ? 0 : legislatorLastModified,
    Number.isNaN(scoreLastModified) ? 0 : scoreLastModified,
    Date.now()
  );

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
  params
}: {
  params: Promise<{ bioguide: string }>;
}) {
  const { bioguide } = await params;
  const reportData = await getReportData(bioguide);

  if (!reportData) {
    notFound();
  }

  const { legislator, score } = reportData;
  const calculated = calculateEpsteinScore(score);
  const currentTerm = legislator.terms[legislator.terms.length - 1];
  const eta = score.epstein_transparency_act;
  const scoreColor = calculated.score > 3.0 ? 'text-emerald-700' : calculated.score > 2.0 ? 'text-orange-700' : 'text-rose-700';
  const termEndYear = Number.parseInt((currentTerm.end || '').slice(0, 4), 10);
  const derivedUpForElection2026 = Number.isFinite(termEndYear) ? termEndYear === 2027 : false;
  const upForElection2026 = score.election?.up_for_election_2026 ?? derivedUpForElection2026;
  const hasOversightSeat = hasRelevantOversightSeat(score.committee_seat || []);

  const actionRows = buildReportActionRows({
    score: calculated.score,
    publicPressureScore: score.public_pressure_score,
    hasOversightSeat,
    eta
  });
  const toneContent = getReportToneContent(
    {
      score: calculated.score,
      publicPressureScore: score.public_pressure_score,
      hasOversightSeat,
      eta
    },
    actionRows
  );

  return (
    <main className="startup-shell min-h-screen px-4 py-4 sm:px-6 sm:py-5">
      <article className="mx-auto w-full max-w-[960px] space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
          <Link href="/" className="text-sm font-semibold text-[var(--brand-blue)] hover:underline">
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
                <span>·</span>
                <p className={upForElection2026 ? 'font-semibold text-[var(--brand-gold)]' : 'font-semibold text-slate-500'}>
                  Up for election in 2026: {upForElection2026 ? 'Yes' : 'No'}
                </p>
                {score.social && (
                  <>
                    <span>·</span>
                    <SocialLinks socials={score.social} />
                  </>
                )}
              </div>

              <CommitteeBadges seats={score.committee_seat || []} className="!mt-1.5" />
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
              We do not yet have an independent summary for {legislator.name.official_full}&rsquo;s actions regarding the Epstein case.
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
              <div key={row.id} className="flex items-start gap-2 py-1">
                <StatusDot positive={row.isPositive} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                  <p className="text-sm text-slate-600">{row.message}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-1">
          <h2 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">{toneContent.outreachTitle}</h2>
          <p className="text-sm text-slate-700">
            {toneContent.outreachBody}
          </p>
        </section>

        <ReportContactCard
          officialName={legislator.name.official_full}
          officeLabel={currentTerm.type === 'sen' ? 'Senator' : 'Representative'}
          phone={currentTerm.phone}
          website={currentTerm.url}
          address={currentTerm.address}
          contactForm={currentTerm.contact_form}
          messageAsk={toneContent.contactAsk}
        />

        {upForElection2026 && (
          <VoterActionCard stateCode={currentTerm.state} />
        )}

        <footer className="border-t border-[var(--border)] pt-4 text-center">
          <Link href="/epstein-files" className="text-xs font-semibold text-[var(--brand-blue)] hover:underline">
            How scoring works
          </Link>
        </footer>
      </article>
    </main>
  );
}
