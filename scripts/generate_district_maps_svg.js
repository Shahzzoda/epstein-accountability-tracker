#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const API_BASE = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/0';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'maps', 'districts', 'svg');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

const WIDTH = 1200;
const HEIGHT = 675;
const PADDING = 36;
const BATCH_SIZE = 20;

const fipsToState = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC',
  '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY',
  '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT',
  '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
  '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY', '60': 'AS', '66': 'GU', '69': 'MP',
  '72': 'PR', '78': 'VI'
};

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json'
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

async function fetchAllFeatures() {
  const idsUrl = `${API_BASE}/query?where=1%3D1&returnIdsOnly=true&f=pjson`;
  const idsPayload = await fetchJson(idsUrl);
  const objectIds = idsPayload.objectIds || [];

  if (objectIds.length === 0) {
    throw new Error('No congressional district OBJECTIDs returned from Census API');
  }

  const batches = chunk(objectIds, BATCH_SIZE);
  const all = [];

  for (let i = 0; i < batches.length; i += 1) {
    const batchIds = batches[i].join(',');
    const queryUrl = `${API_BASE}/query?objectIds=${encodeURIComponent(batchIds)}&outFields=OBJECTID,GEOID,STATE,BASENAME,NAME&returnGeometry=true&outSR=102100&f=pjson`;
    const payload = await fetchJson(queryUrl);
    const features = payload.features || [];
    all.push(...features);

    process.stdout.write(`Fetched geometry batch ${i + 1}/${batches.length}\r`);
  }

  process.stdout.write('\n');
  return all;
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

function flattenRings(features) {
  const rings = [];
  for (const feature of features) {
    const featureRings = feature.geometry?.rings || [];
    for (const ring of featureRings) {
      if (Array.isArray(ring) && ring.length > 2) {
        rings.push(ring);
      }
    }
  }
  return rings;
}

function computeBounds(rings) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  return { minX, minY, maxX, maxY };
}

function projector(bounds) {
  const dx = Math.max(bounds.maxX - bounds.minX, 1);
  const dy = Math.max(bounds.maxY - bounds.minY, 1);

  const scale = Math.min((WIDTH - PADDING * 2) / dx, (HEIGHT - PADDING * 2) / dy);

  const usedW = dx * scale;
  const usedH = dy * scale;
  const offsetX = (WIDTH - usedW) / 2;
  const offsetY = (HEIGHT - usedH) / 2;

  return (x, y) => {
    const px = (x - bounds.minX) * scale + offsetX;
    const py = (bounds.maxY - y) * scale + offsetY;
    return [Number(px.toFixed(1)), Number(py.toFixed(1))];
  };
}

function ringPath(ring, project) {
  if (!ring.length) return '';

  const [startX, startY] = project(ring[0][0], ring[0][1]);
  let d = `M ${startX} ${startY}`;

  for (let i = 1; i < ring.length; i += 1) {
    const [x, y] = project(ring[i][0], ring[i][1]);
    d += ` L ${x} ${y}`;
  }

  d += ' Z';
  return d;
}

function featurePath(feature, project) {
  const rings = feature.geometry?.rings || [];
  return rings.map((ring) => ringPath(ring, project)).join(' ');
}

function buildSvg({ stateCode, districtNumber, stateFeatures, targetFeature }) {
  const stateRings = flattenRings(stateFeatures);
  const bounds = computeBounds(stateRings);
  const project = projector(bounds);

  const basePaths = stateFeatures
    .map((feature) => featurePath(feature, project))
    .filter(Boolean)
    .join(' ');

  const focusPath = featurePath(targetFeature, project);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${stateCode}-${districtNumber} congressional district map">
  <path d="${basePaths}" fill="#d9e1ea" stroke="#9aa9bc" stroke-width="1" fill-rule="evenodd"/>
  <path d="${focusPath}" fill="#1e5ea9" fill-opacity="0.86" stroke="#0b3b75" stroke-width="1.2" fill-rule="evenodd"/>
</svg>
`;
}

async function clearOldAssets() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const existing = await fs.readdir(OUTPUT_DIR);
  const toDelete = existing.filter((name) => name.endsWith('.svg') || name === 'manifest.json');
  await Promise.all(toDelete.map((name) => fs.unlink(path.join(OUTPUT_DIR, name))));
}

async function main() {
  const stateArg = process.argv.find((arg) => arg.startsWith('--state='));
  const districtArg = process.argv.find((arg) => arg.startsWith('--district='));

  const filterState = stateArg ? stateArg.replace('--state=', '').toUpperCase() : null;
  const filterDistrict = districtArg ? districtArg.replace('--district=', '') : null;

  await clearOldAssets();

  const features = await fetchAllFeatures();

  const normalized = features
    .map((feature) => {
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
          KEY: `${stateCode}-${districtNumber}`
        }
      };
    })
    .filter(Boolean);

  const byState = new Map();
  for (const feature of normalized) {
    const stateCode = feature.attributes.STATE_CODE;
    if (!byState.has(stateCode)) {
      byState.set(stateCode, []);
    }
    byState.get(stateCode).push(feature);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: {
      service: 'Census TIGERweb Legislative MapServer/0',
      vintage: '119th Congressional Districts (January 1, 2025)'
    },
    image: {
      format: 'svg',
      width: WIDTH,
      height: HEIGHT
    },
    assets: {}
  };

  let written = 0;

  for (const [stateCode, stateFeatures] of byState.entries()) {
    for (const targetFeature of stateFeatures) {
      const districtNumber = targetFeature.attributes.DISTRICT_NUMBER;
      if (filterState && stateCode !== filterState) {
        continue;
      }
      if (filterDistrict && districtNumber !== filterDistrict) {
        continue;
      }

      const key = `${stateCode}-${districtNumber}`;
      const fileName = `${key}.svg`;
      const relativePath = `/maps/districts/svg/${fileName}`;
      const filePath = path.join(OUTPUT_DIR, fileName);

      const svg = buildSvg({ stateCode, districtNumber, stateFeatures, targetFeature });

      await fs.writeFile(filePath, svg, 'utf8');

      manifest.assets[key] = {
        path: relativePath,
        state: stateCode,
        district: districtNumber,
        geoid: String(targetFeature.attributes.GEOID)
      };

      written += 1;
      process.stdout.write(`Wrote ${written} SVGs\r`);
    }
  }

  process.stdout.write('\n');
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${written} district SVG maps to ${OUTPUT_DIR}`);
  console.log(`Wrote manifest to ${MANIFEST_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
