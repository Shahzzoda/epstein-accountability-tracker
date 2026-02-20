import { NextRequest, NextResponse } from 'next/server';

// Static voter-registration URLs by state — always available regardless of election cycle
const REGISTRATION_URLS: Record<string, string> = {
  AL: 'https://www.sos.alabama.gov/alabama-votes/voter/register-to-vote',
  AK: 'https://voterregistration.alaska.gov/',
  AZ: 'https://my.arizona.vote/PortalList.aspx',
  AR: 'https://www.sos.arkansas.gov/elections/voter-information/voter-registration-information/',
  CA: 'https://registertovote.ca.gov/',
  CO: 'https://www.sos.state.co.us/voter/pages/pub/olvr/verifyNewVoter.xhtml',
  CT: 'https://voterregistration.ct.gov/OLVR/welcome.do',
  DE: 'https://ivote.de.gov/VoterView/registrant/newregistrant.do',
  FL: 'https://registertovoteflorida.gov/home',
  GA: 'https://registertovote.sos.ga.gov/',
  HI: 'https://olvr.hawaii.gov/',
  ID: 'https://sos.idaho.gov/elections-division/voter-registration/',
  IL: 'https://www.elections.il.gov/ElectionOperations/VoterRegistrationSearch.aspx',
  IN: 'https://indianavoters.in.gov/',
  IA: 'https://mymvd.iowadot.gov/Account/Login?ReturnUrl=%2FVoterRegistration',
  KS: 'https://www.kssos.org/elections/elections_registration.html',
  KY: 'https://vrsws.sos.ky.gov/ovrweb/',
  LA: 'https://voterportal.sos.la.gov/',
  ME: 'https://www.maine.gov/sos/cec/elec/voter-info/votreg.html',
  MD: 'https://voterservices.elections.maryland.gov/OnlineVoterRegistration/InstructionsStep1',
  MA: 'https://www.sec.state.ma.us/ovr/',
  MI: 'https://mvic.sos.state.mi.us/RegisterVoter',
  MN: 'https://www.sos.state.mn.us/elections-voting/register-to-vote/',
  MS: 'https://www.sos.ms.gov/elections-voting/voter-registration',
  MO: 'https://s1.sos.mo.gov/elections/voterregistration/',
  MT: 'https://sosmt.gov/elections/vote/',
  NE: 'https://www.nebraska.gov/apps-sos-voter-registration/',
  NV: 'https://www.nvsos.gov/voters',
  NH: 'https://www.sos.nh.gov/elections/voters/register-vote',
  NJ: 'https://voter.svrs.nj.gov/register',
  NM: 'https://portal.sos.state.nm.us/OVR/WebPages/InstructionsStep1.aspx',
  NY: 'https://voterreg.dmv.ny.gov/MotorVoter/',
  NC: 'https://www.ncsbe.gov/registering/how-register',
  ND: 'https://vip.sos.nd.gov/PortalListDetails.aspx?ptlhPKID=79&ptlPKID=8',
  OH: 'https://www.ohiosos.gov/elections/voters/',
  OK: 'https://www.vote.org/register-to-vote/oklahoma/',
  OR: 'https://sos.oregon.gov/voting/Pages/register-vote.aspx',
  PA: 'https://www.vote.pa.gov/Register-to-Vote/Pages/default.aspx',
  RI: 'https://vote.sos.ri.gov/',
  SC: 'https://www.scvotes.gov/scsec/registertovote.do',
  SD: 'https://sdsos.gov/elections-voting/voting/register-to-vote/',
  TN: 'https://ovr.govote.tn.gov/',
  TX: 'https://www.sos.state.tx.us/elections/voter/reqvr.shtml',
  UT: 'https://vote.utah.gov/vote/menu/index.html',
  VT: 'https://olvr.vermont.gov/',
  VA: 'https://www.elections.virginia.gov/registration/how-to-register/',
  WA: 'https://voter.votewa.gov/WhereToVote.aspx',
  WV: 'https://ovr.sos.wv.gov/Register/Landing',
  WI: 'https://myvote.wi.gov/en-US/RegisterToVote',
  WY: 'https://sos.wyo.gov/elections/citizens.aspx',
  DC: 'https://vr.elections.dc.gov/ovr/WebPages/InstructionsStep1.aspx',
};

interface CivicElection {
  id: string;
  name: string;
  electionDay: string;
  ocdDivisionId: string;
}

interface PollingAddress {
  locationName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface PollingLocation {
  address?: PollingAddress;
  name?: string;
  pollingHours?: string;
  notes?: string;
}

// Extract 2-letter state abbreviation from an OCD division ID
// e.g. "ocd-division/country:us/state:ca" → "CA"
function stateFromOcd(ocdId: string): string | null {
  const match = ocdId.match(/\/state:([a-z]{2})/);
  return match ? match[1].toUpperCase() : null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  // stateCode is passed as a hint so we can always return the registration URL
  const stateCode = searchParams.get('state')?.toUpperCase() ?? null;

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_CIVI_API;
  if (!apiKey) {
    return NextResponse.json({ error: 'Civic API not configured' }, { status: 500 });
  }

  // Step 1: Reverse-geocode to get a proper street address
  let address = `${lat},${lon}`; // fallback: pass coords directly to Civic API
  let geocodedState: string | null = stateCode;

  try {
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`
    );
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const result = geoData.results?.[0];
      if (result?.formatted_address) {
        address = result.formatted_address as string;
        // Extract state from address components
        const stateComp = (result.address_components as Array<{ types: string[]; short_name: string }> | undefined)
          ?.find((c) => c.types.includes('administrative_area_level_1'));
        if (stateComp) geocodedState = stateComp.short_name.toUpperCase();
      }
    }
  } catch {
    // Non-fatal — continue with lat,lon as address string
  }

  const effectiveState = geocodedState ?? stateCode;
  const registrationUrl =
    (effectiveState ? REGISTRATION_URLS[effectiveState] : null) ?? 'https://www.vote.org/register-to-vote/';

  // Step 2: Query /elections to find upcoming elections for this state (always works)
  let upcomingElections: CivicElection[] = [];
  try {
    const electionsRes = await fetch(
      `https://www.googleapis.com/civicinfo/v2/elections?key=${apiKey}`
    );
    if (electionsRes.ok) {
      const electionsData = await electionsRes.json();
      const all: CivicElection[] = electionsData.elections ?? [];
      const today = new Date().toISOString().slice(0, 10);

      upcomingElections = all
        .filter((e) => {
          if (e.electionDay < today) return false;
          if (e.id === '2000') return false; // VIP test election
          // Keep national elections and elections that match this state
          const electionState = stateFromOcd(e.ocdDivisionId);
          return electionState === null || electionState === effectiveState;
        })
        .sort((a, b) => a.electionDay.localeCompare(b.electionDay))
        .slice(0, 3);
    }
  } catch {
    // Non-fatal
  }

  // Step 3: Try voterInfoQuery for real-time polling locations
  let pollingLocations: PollingLocation[] = [];
  let earlyVoteSites: PollingLocation[] = [];
  let voterInfoElection: CivicElection | null = null;
  let voterInfoRegistrationUrl: string | null = null;
  let votingLocationFinderUrl: string | null = null;

  try {
    const civicRes = await fetch(
      `https://www.googleapis.com/civicinfo/v2/voterinfo?key=${apiKey}&address=${encodeURIComponent(address)}`
    );
    if (civicRes.ok) {
      const civic = await civicRes.json();
      pollingLocations = (civic.pollingLocations ?? []).slice(0, 4) as PollingLocation[];
      earlyVoteSites = (civic.earlyVoteSites ?? []).slice(0, 2) as PollingLocation[];
      voterInfoElection = civic.election ?? null;
      const adminBody = civic.state?.[0]?.electionAdministrationBody ?? null;
      voterInfoRegistrationUrl = adminBody?.electionRegistrationUrl ?? null;
      votingLocationFinderUrl = adminBody?.votingLocationFinderUrl ?? null;
    }
  } catch {
    // Non-fatal — polling data just isn't available yet
  }

  // Prefer the voterInfo election (most specific), fall back to the /elections list
  const primaryElection = voterInfoElection ?? upcomingElections[0] ?? null;

  return NextResponse.json({
    election: primaryElection,
    upcomingElections,
    pollingLocations,
    earlyVoteSites,
    registrationUrl: voterInfoRegistrationUrl ?? registrationUrl,
    votingLocationFinderUrl: votingLocationFinderUrl ?? null,
    address,
    state: effectiveState,
  });
}
