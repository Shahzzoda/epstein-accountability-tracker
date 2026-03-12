"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useRouter } from "next/navigation";
import { calculateEpsteinScore, type RawScoreEntry } from "@/lib/scoring";

const geoUrl = "/maps/congressional-districts.json";

type DistrictGeo = {
  properties: {
    STATEFP?: string;
    CD118FP?: string;
    GEOID?: string;
  };
};

type Legislator = {
  id: { bioguide?: string };
  terms?: Array<{
    type?: string;
    state?: string;
    district?: number;
  }>;
};

type ScoreFile = {
  scores?: Record<string, RawScoreEntry>;
};

const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE",
  "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA",
  "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
  "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM",
  "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
  "54": "WV", "55": "WI", "56": "WY", "60": "AS", "66": "GU", "69": "MP", "72": "PR", "78": "VI"
};
const STATE_TO_FIPS: Record<string, string> = Object.fromEntries(
  Object.entries(FIPS_TO_STATE).map(([fips, state]) => [state, fips])
);

export default function InteractiveMap() {
  const router = useRouter();
  const [tooltipContent, setTooltipContent] = useState("");
  const [districtScores, setDistrictScores] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;

    const loadDistrictScores = async () => {
      try {
        const [legislatorRes, scoreRes] = await Promise.all([
          fetch("/data/legislators/current_legislators.json"),
          fetch("/data/epstein_scores.json")
        ]);

        if (!legislatorRes.ok || !scoreRes.ok) return;

        const [legislators, scoreFile] = (await Promise.all([
          legislatorRes.json(),
          scoreRes.json()
        ])) as [Legislator[], ScoreFile];

        const scoreMap = scoreFile.scores ?? {};
        const nextDistrictScores: Record<string, number> = {};

        for (const legislator of legislators) {
          const currentTerm = legislator.terms?.at(-1);
          if (!currentTerm || currentTerm.type !== "rep" || !currentTerm.state) continue;

          const stateFips = STATE_TO_FIPS[currentTerm.state];
          if (!stateFips) continue;

          const districtNum = currentTerm.district ?? 0;
          const districtCode = districtNum === 0 ? "00" : String(districtNum).padStart(2, "0");
          const geoid = `${stateFips}${districtCode}`;

          const bioguide = legislator.id.bioguide;
          if (!bioguide) continue;

          const calculated = calculateEpsteinScore(scoreMap[bioguide]);
          nextDistrictScores[geoid] = calculated.score;
        }

        if (active) setDistrictScores(nextDistrictScores);
      } catch {
        // If score data fails to load, keep neutral map styles.
      }
    };

    void loadDistrictScores();

    return () => {
      active = false;
    };
  }, []);

  const colorScale = useMemo(
    () => ({
      low: { r: 250, g: 233, b: 192 }, // brighter pale gold
      midLow: { r: 140, g: 74, b: 0 }, // darker but still saturated bronze
      midHigh: { r: 245, g: 255, b: 236 }, // very light green
      high: { r: 0, g: 96, b: 36 }, // richer green
      neutral: { r: 194, g: 203, b: 214 },
      light: { r: 255, g: 255, b: 255 },
      dark: { r: 15, g: 23, b: 42 }
    }),
    []
  );

  const mix = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, weight: number) => {
    const w = Math.max(0, Math.min(1, weight));
    return {
      r: Math.round(a.r + (b.r - a.r) * w),
      g: Math.round(a.g + (b.g - a.g) * w),
      b: Math.round(a.b + (b.b - a.b) * w)
    };
  };

  const toCss = (color: { r: number; g: number; b: number }) => `rgb(${color.r}, ${color.g}, ${color.b})`;

  const curveScore = (score?: number) => {
    if (typeof score !== "number") return null;
    const normalized = Math.max(0, Math.min(1, score / 5));
    const contrast = 1.45;
    const curved = 1 / (1 + Math.exp(-contrast * 6 * (normalized - 0.5)));
    const min = 1 / (1 + Math.exp(contrast * 3));
    const max = 1 / (1 + Math.exp(-contrast * 3));
    return (curved - min) / (max - min);
  };

  const scoreToVividRgb = (score?: number) => {
    const normalized = curveScore(score);
    if (typeof normalized !== "number") return null;
    if (normalized <= 0.5) {
      return mix(colorScale.low, colorScale.midLow, normalized / 0.5);
    }
    return mix(colorScale.midHigh, colorScale.high, (normalized - 0.5) / 0.5);
  };

  const scoreToVividColor = (score?: number) => {
    const vivid = scoreToVividRgb(score);
    return vivid ? toCss(vivid) : "#d7dde5";
  };

  const scoreToPressedColor = (score?: number) => {
    const vivid = scoreToVividRgb(score);
    if (!vivid) return "#b8c2cf";
    return toCss(mix(vivid, colorScale.dark, 0.24));
  };

  const scoreToHoverColor = (score?: number) => {
    const vivid = scoreToVividRgb(score);
    if (!vivid) return "#cbd5e1";
    return toCss(mix(vivid, colorScale.light, 0.14));
  };

  const handleDistrictClick = (geo: DistrictGeo) => {
    const stateFips = geo.properties.STATEFP;
    const district = geo.properties.CD118FP;

    if (stateFips && district) {
      router.push(`/results?stateFips=${stateFips}&district=${district}`);
    }
  };

  const handleMouseEnter = (geo: DistrictGeo) => {
    const stateFips = geo.properties.STATEFP;
    const district = geo.properties.CD118FP;
    if (!stateFips || !district) return;

    const stateAbbr = FIPS_TO_STATE[stateFips] || stateFips;
    const distText = district === "00" ? "AL" : parseInt(district, 10).toString();
    setTooltipContent(`${stateAbbr}-${distText}`);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <ComposableMap
        projection="geoAlbersUsa"
        className="h-full w-full"
        projectionConfig={{ scale: 1000 }}
      >
        <ZoomableGroup
          zoom={1}
          maxZoom={5}
          filterZoomEvent={(event) => (event as unknown as Event).type !== "wheel"}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => handleDistrictClick(geo)}
                  onMouseEnter={() => handleMouseEnter(geo)}
                  onMouseLeave={() => setTooltipContent("")}
                  style={{
                    default: {
                      fill: scoreToVividColor(districtScores[geo.properties?.GEOID ?? ""]),
                      outline: "none",
                      stroke: "#f7fafc",
                      strokeWidth: 0.55,
                      transition: "fill 180ms ease"
                    },
                    hover: {
                      fill: scoreToHoverColor(districtScores[geo.properties?.GEOID ?? ""]),
                      outline: "none",
                      cursor: "pointer",
                      stroke: "#f7fafc",
                      strokeWidth: 0.55,
                      transition: "fill 180ms ease"
                    },
                    pressed: {
                      fill: scoreToPressedColor(districtScores[geo.properties?.GEOID ?? ""]),
                      outline: "none"
                    }
                  }}
                />
              ))
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {tooltipContent && (
        <div className="pointer-events-none absolute left-1/2 top-44 z-50 -translate-x-1/2 rounded-full bg-slate-900/72 px-4 py-1 text-sm font-semibold tracking-[0.12em] text-white uppercase sm:top-48">
          {tooltipContent}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 right-3 z-40 rounded-full border border-slate-300/90 bg-white/75 px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-slate-700 backdrop-blur-[2px]">
        <div className="mb-1 flex items-center justify-between gap-3 uppercase">
          <span>Blocking</span>
          <span>Leading</span>
        </div>
        <div
          className="h-2 w-44 rounded-full border border-white/60"
          style={{
            background: "linear-gradient(90deg, rgb(140, 74, 0) 0%, rgb(250, 233, 192) 49%, rgb(245, 255, 236) 51%, rgb(0, 96, 36) 100%)"
          }}
        />
      </div>
    </div>
  );
}
