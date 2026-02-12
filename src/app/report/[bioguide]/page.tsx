import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import ShareButton from '@/components/ShareButton';
import ReportContactCard from '@/components/ReportContactCard';
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

interface ScoreEntry {
  score?: number;
  status?: string;
  notes?: string;
  epstein_transparency_act?: {
    sponsored?: boolean;
    cosponsored?: boolean;
    cosponsored_date?: string | null;
    signed?: 'yes' | 'no' | boolean | string;
    discharge_petition?: { signed?: boolean; date?: string | null };
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

async function getReportData(bioguide: string): Promise<ReportData | null> {
  const legislatorPath = path.join(process.cwd(), 'public', 'data/current_legislators.json');
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

  const datasetHash = createHash('sha256').update(legislatorRaw).update(scoreRaw).digest('hex').slice(0, 12);
  const newestMtime = Math.max(legislatorStat.mtimeMs, scoreStat.mtimeMs);

  return {
    legislator,
    score,
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
      title: 'Official Profile Report | Epstein Files Tracker',
      description: 'Open an official profile report and review tracked public-record actions linked to Epstein files.'
    };
  }

  const currentTerm = reportData.legislator.terms[reportData.legislator.terms.length - 1];
  const calculated = calculateEpsteinScore(reportData.score);
  const title = `${reportData.legislator.name.official_full} Report | Epstein Files Tracker`;
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
          alt: 'Epstein Files Tracker share image'
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

  const { legislator, score } = reportData;
  const calculated = calculateEpsteinScore(score);
  const currentTerm = legislator.terms[legislator.terms.length - 1];
  const eta = score.epstein_transparency_act;
  const scoreColor = calculated.score >= 4 ? 'text-emerald-700' : calculated.score >= 3 ? 'text-emerald-600' : calculated.score > 2 ? 'text-amber-700' : 'text-rose-700';
  const imageUrl = `https://raw.githubusercontent.com/unitedstates/images/master/congress/225x275/${legislator.id.bioguide}.jpg`;

  const actionRows = [
    {
      label: 'Sponsored release legislation',
      isPositive: Boolean(eta?.sponsored),
      context: 'Sponsoring disclosure legislation matters because it sets the public accountability agenda in law.'
    },
    {
      label: 'Cosponsored release legislation',
      isPositive: Boolean(eta?.cosponsored),
      context: 'Cosponsoring helps build enough support to move disclosure bills through Congress.'
    },
    {
      label: 'Signed discharge petition',
      isPositive: Boolean(eta?.discharge_petition?.signed),
      context: 'A discharge petition can force a public vote when leadership does not schedule one.'
    },
    {
      label: 'Recorded vote support',
      isPositive: eta?.signed === 'yes' || eta?.signed === true,
      context: 'Recorded votes create a clear public record of where this office stands on full release.'
    }
  ];
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
              <Image
                src={imageUrl}
                alt={legislator.name.official_full}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl leading-tight text-slate-900 sm:text-4xl">{legislator.name.official_full}</h1>
              <p className="text-sm text-slate-700">
                {currentTerm.type === 'sen' ? `United States Senator (${currentTerm.state})` : `U.S. Representative (${currentTerm.state}-${currentTerm.district})`} · {currentTerm.party}
              </p>
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

        <section className="space-y-2 pb-2">
          <p className="text-sm text-slate-700">
            DOJ transparency on full file release.
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
