"""
Election status updater for Rep Finder.

Purpose:
- Determine which current members of Congress are up for election in 2026.
- Write that status into public/data/epstein_scores.json for each scored lawmaker.

Logic:
- Uses FEC API incumbent filings for 2026 when available.
- Falls back to current term end date from public/data/legislators/current_legislators.json.
- Fallback rule: if current term ends in 2027, that member is up in the 2026 general election.

Usage:
  python scripts/primaries.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any
import time

import requests

ROOT = Path(__file__).resolve().parents[1]
LEGISLATORS_PATH = ROOT / 'public' / 'data' / 'legislators' / 'current_legislators.json'
SCORES_PATH = ROOT / 'public' / 'data' / 'epstein_scores.json'
FEC_BASE = 'https://api.open.fec.gov/v1'
FEC_API_KEY = os.getenv('FEC_API_KEY', 'DEMO_KEY')
ELECTION_YEAR = 2026


def read_json(path: Path) -> Any:
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)


def write_json(path: Path, data: Any) -> None:
    with path.open('w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
        f.write('\n')


def parse_end_year(end_date: str | None) -> int | None:
    if not end_date:
        return None
    try:
        return int(end_date.split('-', 1)[0])
    except (ValueError, IndexError):
        return None


def normalize_last_name(official_full_name: str | None) -> str:
    if not official_full_name:
        return ''
    parts = official_full_name.replace(',', ' ').split()
    if not parts:
        return ''
    return ''.join(ch for ch in parts[-1].lower() if ch.isalpha())


def normalize_fec_name_last(name: str | None) -> str:
    if not name:
        return ''
    # FEC name is commonly "LAST, FIRST M" or similar.
    first_segment = name.split(',', 1)[0].strip()
    return ''.join(ch for ch in first_segment.lower() if ch.isalpha())


def fetch_fec_incumbent_signatures() -> set[tuple[str, str, str]]:
    """
    Returns a set of tuples in the form:
      (office_type, state, normalized_last_name)
    where office_type is 'rep' or 'sen'.
    """
    signatures: set[tuple[str, str, str]] = set()
    office_map = {'H': 'rep', 'S': 'sen'}

    for office in ('H', 'S'):
        page = 1
        while True:
            params = {
                'api_key': FEC_API_KEY,
                'election_year': ELECTION_YEAR,
                'office': office,
                'per_page': 100,
                'page': page,
                # 'I' = Incumbent
                'incumbent_challenge': 'I',
                'sort': 'name',
            }
            resp = requests.get(f'{FEC_BASE}/candidates/', params=params, timeout=20)
            resp.raise_for_status()
            payload = resp.json()
            rows = payload.get('results', [])
            if not rows:
                break

            for row in rows:
                state = row.get('state')
                last_name = normalize_fec_name_last(row.get('name'))
                if not state or not last_name:
                    continue
                signatures.add((office_map[office], state, last_name))

            pagination = payload.get('pagination', {})
            if page >= pagination.get('pages', page):
                break
            page += 1
            time.sleep(0.25)

    return signatures


def build_election_payload(
    current_term: dict[str, Any],
    legislator_name: str | None,
    fec_signatures: set[tuple[str, str, str]],
) -> dict[str, Any]:
    end_date = current_term.get('end')
    end_year = parse_end_year(end_date)
    office_type = current_term.get('type')
    state = current_term.get('state')
    last_name = normalize_last_name(legislator_name)
    fec_match = (office_type, state, last_name) in fec_signatures if office_type and state and last_name else False

    up_for_2026 = fec_match or end_year == 2027
    next_election_year = end_year - 1 if end_year else None

    return {
        'up_for_election_2026': up_for_2026,
        'next_election_year': next_election_year,
        'current_term_end': end_date,
        'source': 'fec_api' if fec_match else 'term_end_fallback',
    }


def update_scores() -> tuple[int, int, int]:
    legislators = read_json(LEGISLATORS_PATH)
    score_file = read_json(SCORES_PATH)

    scores = score_file.get('scores', {})
    updated = 0
    missing = 0
    api_matched = 0

    try:
        fec_signatures = fetch_fec_incumbent_signatures()
        print(f'Loaded {len(fec_signatures)} incumbent filing signatures from FEC API.')
    except Exception as exc:
        print(f'FEC API unavailable, using fallback-only mode: {exc}')
        fec_signatures = set()

    for legislator in legislators:
        bioguide = legislator.get('id', {}).get('bioguide')
        official_full = legislator.get('name', {}).get('official_full')
        terms = legislator.get('terms') or []
        if not bioguide or not terms:
            continue

        current_term = terms[-1]
        office_type = current_term.get('type')
        if office_type not in {'rep', 'sen'}:
            continue

        entry = scores.get(bioguide)
        if not isinstance(entry, dict):
            missing += 1
            continue

        election = build_election_payload(current_term, official_full, fec_signatures)
        entry['election'] = election
        if election.get('source') == 'fec_api':
            api_matched += 1
        updated += 1

    write_json(SCORES_PATH, score_file)
    return updated, missing, api_matched


def main() -> None:
    updated, missing, api_matched = update_scores()
    print(f'Updated election status for {updated} score entries.')
    print(f'FEC API-confirmed incumbents: {api_matched}.')
    print(f'Skipped {missing} lawmakers with no explicit score entry (report page will still derive status from term data).')


if __name__ == '__main__':
    main()
