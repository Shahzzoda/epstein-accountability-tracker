#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const API_BASE = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/0';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'maps', 'districts', 'png');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

const WIDTH = 1200;
const HEIGHT = 675;
const CONCURRENCY = 8;

const fipsToState = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC',
  '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY',
  '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT',
  '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
  '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY', '60': 'AS', '66': 'GU', '69': 'MP',
  '72': 'PR', '78': 'VI'
};

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(`ArcGIS error ${json.error.code}: ${json.error.message}`);
  }
  return json;
}

async function fetchImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image export failed (${response.status}): ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function normalizeDistrictNumber(attrs) {
  const name = `${attrs.BASENAME || ''} ${attrs.NAME || ''}`.toLowerCase();
  if (name.includes('at large')) {
    return '0';
  }

  const geoid = String(attrs.GEOID || '');
  if (geoid.length >= 4) {
    const numeric = parseInt(geoid.slice(2), 10);
    if (!Number.isNaN(numeric)) {
      return String(numeric);
    }
  }

  const digitMatch = String(attrs.BASENAME || '').match(/\d+/);
  if (digitMatch) {
    return String(parseInt(digitMatch[0], 10));
  }

  return '0';
}

function toBbox(extent) {
  return [extent.xmin, extent.ymin, extent.xmax, extent.ymax].join(',');
}

async function getDistrictFeatures() {
  const queryUrl = `${API_BASE}/query?where=1%3D1&outFields=GEOID,STATE,BASENAME,NAME&returnGeometry=false&f=pjson`;
  const payload = await fetchJson(queryUrl);
  return payload.features || [];
}

async function getStateExtent(stateFips) {
  const queryUrl = `${API_BASE}/query?where=${encodeURIComponent(`STATE='${stateFips}'`)}&returnExtentOnly=true&f=pjson`;
  const payload = await fetchJson(queryUrl);
  if (!payload.extent) {
    throw new Error(`No extent returned for state FIPS ${stateFips}`);
  }
  return payload.extent;
}

async function clearOldAssets() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const existing = await fs.readdir(OUTPUT_DIR);
  const toDelete = existing.filter((name) => name.endsWith('.png') || name === 'manifest.json');
  await Promise.all(toDelete.map((name) => fs.unlink(path.join(OUTPUT_DIR, name))));
}

async function runWithConcurrency(tasks, limit) {
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (index < tasks.length) {
      const current = tasks[index];
      index += 1;
      await current();
    }
  });
  await Promise.all(workers);
}

async function main() {
  const stateArg = process.argv.find((arg) => arg.startsWith('--state='));
  const districtArg = process.argv.find((arg) => arg.startsWith('--district='));

  const filterState = stateArg ? stateArg.replace('--state=', '').toUpperCase() : null;
  const filterDistrict = districtArg ? districtArg.replace('--district=', '') : null;

  await clearOldAssets();

  const features = await getDistrictFeatures();
  const normalized = features.map((feature) => {
    const attrs = feature.attributes || {};
    const stateFips = String(attrs.STATE || '');
    const stateCode = fipsToState[stateFips];

    if (!stateCode) {
      return null;
    }

    const districtNumber = normalizeDistrictNumber(attrs);

    return {
      ...feature,
      attributes: {
        ...attrs,
        STATE_FIPS: stateFips,
        STATE_CODE: stateCode,
        DISTRICT_NUMBER: districtNumber,
        KEY: `${stateCode}-${districtNumber}`,
        GEOID: String(attrs.GEOID || '')
      }
    };
  }).filter(Boolean);

  const byStateFips = new Map();
  for (const feature of normalized) {
    const stateFips = feature.attributes.STATE_FIPS;
    if (!byStateFips.has(stateFips)) {
      byStateFips.set(stateFips, []);
    }
    byStateFips.get(stateFips).push(feature);
  }

  const stateExtents = {};
  for (const stateFips of byStateFips.keys()) {
    stateExtents[stateFips] = await getStateExtent(stateFips);
    process.stdout.write(`Fetched extent for ${stateFips}\r`);
  }
  process.stdout.write('\n');

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: {
      service: 'Census TIGERweb Legislative MapServer/0',
      vintage: '119th Congressional Districts (January 1, 2025)'
    },
    image: {
      format: 'png',
      width: WIDTH,
      height: HEIGHT
    },
    assets: {}
  };

  const tasks = [];
  let written = 0;

  for (const feature of normalized) {
    const attrs = feature.attributes;
    const stateCode = attrs.STATE_CODE;
    const stateFips = attrs.STATE_FIPS;
    const districtNumber = attrs.DISTRICT_NUMBER;
    const geoid = attrs.GEOID;

    if (filterState && stateCode !== filterState) {
      continue;
    }
    if (filterDistrict && districtNumber !== filterDistrict) {
      continue;
    }

    const key = `${stateCode}-${districtNumber}`;
    const fileName = `${key}.png`;
    const relativePath = `/maps/districts/png/${fileName}`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    const bbox = toBbox(stateExtents[stateFips]);

    const params = new URLSearchParams({
      bbox,
      bboxSR: '102100',
      size: `${WIDTH},${HEIGHT}`,
      imageSR: '102100',
      format: 'png32',
      transparent: 'true',
      layers: 'show:0',
      layerDefs: `0:STATE='${stateFips}'`,
      selectionDefinitions: `0:GEOID='${geoid}'`,
      f: 'image'
    });

    tasks.push(async () => {
      const exportUrl = `${API_BASE.replace('/0', '')}/export?${params.toString()}`;
      const image = await fetchImage(exportUrl);
      await fs.writeFile(filePath, image);

      manifest.assets[key] = {
        path: relativePath,
        state: stateCode,
        district: districtNumber,
        geoid
      };

      written += 1;
      process.stdout.write(`Wrote ${written} images\r`);
    });
  }
  await runWithConcurrency(tasks, CONCURRENCY);
  process.stdout.write('\n');

  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${written} district maps to ${OUTPUT_DIR}`);
  console.log(`Wrote manifest to ${MANIFEST_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
