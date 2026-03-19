'use client';

import { useState, type MouseEvent, type FocusEvent } from 'react';
import { createPortal } from 'react-dom';

export interface CommitteeSeat {
  title: string;
  committee: string;
  thomas_id?: string;
}

const COMMITTEE_CONTEXT: Record<string, string> = {
  HSJU: 'Primary oversight of the Department of Justice and FBI. Has the power to subpoena Attorney General records, conduct impeachment hearings, and oversee constitutional rights.',
  SSJU: 'Primary oversight of the Department of Justice and FBI. Handles confirmation of judges and Attorney General. Has power to subpoena DOJ records.',
  HSGO: 'The main investigative body of Congress with broad subpoena power to investigate executive branch misconduct, including at the DOJ and intelligence agencies.',
  SSGA: 'The Senate\'s primary oversight committee with broad jurisdiction over government operations and the Department of Homeland Security. Can investigate agency mismanagement.',
  HLIG: 'Oversees the intelligence community (CIA, NSA, FBI) and holds the power to declassify information related to national security and intelligence failures.',
  SLIN: 'Oversees the intelligence community and can investigate intelligence failures. Has power to review covert actions and budget.',
  HSAP: 'Controls the "power of the purse." Can withhold funding from specific DOJ investigations or officials to force accountability and transparency.',
  SSAP: 'Controls federal spending. Can leverage funding decisions to demand accountability and transparency from the DOJ and other agencies.',
  HSRU: 'The "Speaker\'s Committee" that determines which bills reach the floor and under what rules, critical for forcing votes on transparency legislation.',
  SSRA: 'Oversees Senate rules and procedures. Critical for determining how transparency legislation moves through the chamber.',
  HSAS: 'Oversees the Department of Defense. Can demand accountability for military intelligence activities and executive branch national security decisions.',
  SSAS: 'Oversees the Department of Defense. Holds confirmation power over military leadership and can investigate national security failures.',
  HSFA: 'Oversees the State Department and foreign policy. Can investigate executive branch diplomatic conduct and international agreements.',
  SSFR: 'Oversees foreign policy and treaties. Holds confirmation power over State Department officials and can investigate diplomatic failures.',
  HSHM: 'Oversees the Department of Homeland Security. Can investigate border security failures and executive branch homeland security actions.',
  HSWM: 'The chief tax-writing committee. Has unique authority to request tax returns and oversee Treasury Department enforcement actions.',
  SSFI: 'Oversees taxation, trade, and health programs. Has jurisdiction over the Treasury Department and can investigate financial misconduct.',
  HSIF: 'Oversees healthcare, energy, and telecommunications. Can investigate executive branch regulatory overreach and agency failures in these critical sectors.',
  SSCM: 'Oversees commerce, science, and transportation. Can investigate executive branch regulatory actions and agency conduct in these areas.',
  SSBU: 'Responsible for drafting the budget plan. Can highlight executive branch spending inefficiencies and demand fiscal responsibility.',
  HSBU: 'Responsible for drafting the budget usage. Can highlight executive branch spending inefficiencies and demand fiscal responsibility.'
};

function getPriority(title: string) {
  if (title.includes('Chair') || title.includes('Chairman')) return 0;
  if (title.includes('Ranking')) return 1;
  if (title.includes('Vice')) return 2;
  return 3;
}

function getLeadershipRoleLabel(title: string): string | null {
  if (title === 'Chair' || title === 'Chairman') return 'Committee Chair';
  if (title === 'Ranking Member') return 'Ranking Member';
  if (title === 'Subcommittee Chair') return 'Subcommittee Chair';
  if (title === 'Subcommittee Ranking Member') return 'Subcommittee Ranking Member';
  return null;
}

interface CommitteeBadgesProps {
  seats: CommitteeSeat[];
  compact?: boolean;
  className?: string;
}

interface TooltipEntry {
  label: string;
  contextText: string;
}

interface ActiveTooltip {
  entries: TooltipEntry[];
  cursorY: number;
  left: number;
  placement: 'above' | 'below';
  arrowLeft: number;
}

export default function CommitteeBadges({
  seats,
  compact = false,
  className = ''
}: CommitteeBadgesProps) {
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);

  const displayCommittees = [...seats].sort((a, b) => getPriority(a.title) - getPriority(b.title));
  const committeeNames = [...new Set(displayCommittees.map((seat) => seat.committee))];
  const leadershipRoles = [
    ...new Set(
      displayCommittees
        .map((seat) => getLeadershipRoleLabel(seat.title))
        .filter((role): role is string => role !== null)
    )
  ];
  const tooltipEntries: TooltipEntry[] = displayCommittees
    .map((seat) => {
      const contextText = seat.thomas_id ? COMMITTEE_CONTEXT[seat.thomas_id] || '' : '';
      if (!contextText) return null;

      return {
        label: seat.title && seat.title !== 'Member'
          ? `${seat.committee}, ${seat.title}`
          : seat.committee,
        contextText
      };
    })
    .filter((entry): entry is { label: string; contextText: string } => entry !== null);

  if (seats.length === 0) return null;

  function showTooltip(event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>, entries: TooltipEntry[]) {
    const isMouseEvent = 'clientX' in event;
    const rect = event.currentTarget.getBoundingClientRect();
    
    const cursorX = isMouseEvent ? event.clientX : rect.left + rect.width / 2;
    const cursorY = isMouseEvent ? event.clientY : rect.top;

    const tooltipWidth = 320;
    const estimatedHeight = 32 + entries.length * 92;
    const gutter = 12;

    const idealLeft = cursorX - tooltipWidth / 2;

    const left = Math.min(
      Math.max(gutter, idealLeft),
      window.innerWidth - tooltipWidth - gutter
    );

    const placement = cursorY - 10 - estimatedHeight >= gutter ? 'above' : 'below';

    const arrowLeft = cursorX - left;

    setActiveTooltip({
      entries,
      cursorY,
      left,
      placement,
      arrowLeft
    });
  }

  function hideTooltip() {
    setActiveTooltip(null);
  }

  const tooltipContent = activeTooltip && typeof document !== 'undefined' ? createPortal(
    <div
      className="pointer-events-none fixed z-[200] w-80"
      style={{
        ...(activeTooltip.placement === 'above'
          ? { bottom: window.innerHeight - activeTooltip.cursorY + 10 }
          : { top: activeTooltip.cursorY + 10 }),
        left: activeTooltip.left
      }}
    >
      <div className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
        <div className="space-y-2">
          {activeTooltip.entries.map((entry) => (
            <div key={entry.label}>
              <p className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-500">{entry.label}</p>
              <p className="text-sm leading-relaxed text-slate-600">{entry.contextText}</p>
            </div>
          ))}
        </div>
        {activeTooltip.placement === 'above' ? (
          <div 
            className="absolute top-full -mt-2 h-4 w-4 rotate-45 border-b border-r border-slate-200 bg-white"
            style={{ left: Math.max(16, Math.min(320 - 32, activeTooltip.arrowLeft - 8)) }}
          ></div>
        ) : (
          <div 
            className="absolute bottom-full -mb-2 h-4 w-4 rotate-45 border-l border-t border-slate-200 bg-white"
            style={{ left: Math.max(16, Math.min(320 - 32, activeTooltip.arrowLeft - 8)) }}
          ></div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  if (compact) {
    return (
      <>
      <div
        className={`relative z-10 mt-1.5 min-w-0 flex-wrap w-fit text-xs leading-relaxed text-slate-500 ${tooltipEntries.length > 0 ? 'cursor-help decoration-slate-300 underline decoration-dotted underline-offset-2 hover:decoration-slate-400' : ''} ${className}`.trim()}
        onClick={(event) => {
          if (tooltipEntries.length > 0) {
            event.stopPropagation();
          }
        }}
        onKeyDown={(event) => {
          if (tooltipEntries.length > 0) {
            event.stopPropagation();
          }
        }}
        onMouseEnter={(event) => {
          if (tooltipEntries.length > 0) {
            showTooltip(event, tooltipEntries);
          }
        }}
        onMouseMove={(event) => {
          if (tooltipEntries.length > 0) {
            showTooltip(event, tooltipEntries);
          }
        }}
        onMouseLeave={hideTooltip}
        onFocus={(event) => {
          if (tooltipEntries.length > 0) {
            showTooltip(event, tooltipEntries);
          }
        }}
        onBlur={hideTooltip}
      >
        <span>{committeeNames.join(' · ')}</span>
        {leadershipRoles.length > 0 && (
          <span> · {leadershipRoles.join(' · ')}</span>
        )}
      </div>
      {tooltipContent}
      </>
    );
  }

  const containerClassName = 'mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600';

  return (
    <div className={`${containerClassName} ${className}`.trim()}>
      {displayCommittees.map((seat, index) => {
        const contextText = seat.thomas_id ? COMMITTEE_CONTEXT[seat.thomas_id] || '' : '';
        const label = seat.title && seat.title !== 'Member'
          ? `${seat.title} of the ${seat.committee}`
          : seat.committee;
        const entry = contextText ? [{ label, contextText }] : [];

        return (
          <div key={`${seat.committee}-${seat.title}-${index}`} className="relative flex w-fit">
            <span
              className={`leading-relaxed ${contextText ? 'cursor-help decoration-slate-300 underline decoration-dotted underline-offset-2 hover:decoration-slate-400' : ''}`}
              onMouseEnter={(event) => {
                if (entry.length > 0) {
                  showTooltip(event, entry);
                }
              }}
              onMouseMove={(event) => {
                if (entry.length > 0) {
                  showTooltip(event, entry);
                }
              }}
              onMouseLeave={hideTooltip}
              onFocus={(event) => {
                if (entry.length > 0) {
                  showTooltip(event, entry);
                }
              }}
              onBlur={hideTooltip}
            >
              {label}
            </span>
          </div>
        );
      })}
      {tooltipContent}
    </div>
  );
}
