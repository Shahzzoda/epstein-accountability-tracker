"use client";

import React, { useEffect, useRef, useState } from "react";
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

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

const MAP_COLORS = {
  bad: { r: 162, g: 47, b: 42 },
  mid: { r: 245, g: 239, b: 226 },
  good: { r: 22, g: 101, b: 52 },
  stroke: { r: 241, g: 235, b: 224 },
  dark: { r: 15, g: 23, b: 42 },
  white: { r: 255, g: 255, b: 255 }
} as const;

const MAP_BUCKETS = [
  { label: "Opposed", range: "(0.0-1.0)", sampleScore: 0.5 },
  { label: "Limited", range: "(1.1-2.0)", sampleScore: 1.5 },
  { label: "Minimal", range: "(2.1-3.0)", sampleScore: 2.5 },
  { label: "Supportive", range: "(3.1-4.0)", sampleScore: 3.5 },
  { label: "Leading", range: "(4.1-5.0)", sampleScore: 4.5 }
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mixColor(a: RgbColor, b: RgbColor, weight: number): RgbColor {
  const normalizedWeight = clamp(weight, 0, 1);
  return {
    r: Math.round(a.r + (b.r - a.r) * normalizedWeight),
    g: Math.round(a.g + (b.g - a.g) * normalizedWeight),
    b: Math.round(a.b + (b.b - a.b) * normalizedWeight)
  };
}

function toCss(color: RgbColor) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function getMapColor(score?: number) {
  if (typeof score !== "number") return MAP_COLORS.mid;

  const normalizedScore = clamp(score, 0, 5) / 5;
  if (normalizedScore <= 0.5) {
    return mixColor(MAP_COLORS.bad, MAP_COLORS.mid, normalizedScore / 0.5);
  }

  return mixColor(MAP_COLORS.mid, MAP_COLORS.good, (normalizedScore - 0.5) / 0.5);
}

export default function InteractiveMap() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pinchZoomRef = useRef(1);
  const [tooltipContent, setTooltipContent] = useState("");
  const [districtScores, setDistrictScores] = useState<Record<string, number>>({});
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [mapZoom, setMapZoom] = useState(1);

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

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Safari trackpad pinch uses gesture events instead of wheel+ctrlKey.
    const handleGestureStart = (event: Event) => {
      const gestureEvent = event as Event & { scale?: number; preventDefault: () => void };
      gestureEvent.preventDefault();
      pinchZoomRef.current = mapZoom;
    };

    const handleGestureChange = (event: Event) => {
      const gestureEvent = event as Event & { scale?: number; preventDefault: () => void };
      gestureEvent.preventDefault();
      if (typeof gestureEvent.scale !== "number") return;
      const nextZoom = Math.max(1, Math.min(5, pinchZoomRef.current * gestureEvent.scale));
      setMapZoom(nextZoom);
    };

    const handleGestureEnd = (event: Event) => {
      const gestureEvent = event as Event & { preventDefault: () => void };
      gestureEvent.preventDefault();
    };

    element.addEventListener("gesturestart", handleGestureStart as EventListener, { passive: false });
    element.addEventListener("gesturechange", handleGestureChange as EventListener, { passive: false });
    element.addEventListener("gestureend", handleGestureEnd as EventListener, { passive: false });

    return () => {
      element.removeEventListener("gesturestart", handleGestureStart as EventListener);
      element.removeEventListener("gesturechange", handleGestureChange as EventListener);
      element.removeEventListener("gestureend", handleGestureEnd as EventListener);
    };
  }, [mapZoom]);

  const scoreToVividColor = (score?: number) => {
    return toCss(getMapColor(score));
  };

  const scoreToPressedColor = (score?: number) => {
    return toCss(mixColor(getMapColor(score), MAP_COLORS.dark, 0.18));
  };

  const scoreToHoverColor = (score?: number) => {
    return toCss(mixColor(getMapColor(score), MAP_COLORS.white, 0.08));
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
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <ComposableMap
        projection="geoAlbersUsa"
        className="h-full w-full"
        projectionConfig={{ scale: 1000 }}
      >
        <ZoomableGroup
          center={mapCenter}
          zoom={mapZoom}
          maxZoom={5}
          filterZoomEvent={(event) => {
            if (!event) return false;
            if (event.type === "wheel") {
              return Boolean((event as WheelEvent).ctrlKey);
            }
            return !("button" in event) || !(event as MouseEvent).button;
          }}
          onMoveEnd={({ coordinates, zoom }) => {
            setMapCenter([coordinates[0], coordinates[1]]);
            setMapZoom(zoom);
          }}
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
                      stroke: toCss(MAP_COLORS.stroke),
                      strokeWidth: 0.55,
                      transition: "fill 180ms ease"
                    },
                    hover: {
                      fill: scoreToHoverColor(districtScores[geo.properties?.GEOID ?? ""]),
                      outline: "none",
                      cursor: "pointer",
                      stroke: toCss(MAP_COLORS.stroke),
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

      <div className="pointer-events-none absolute bottom-3 right-3 z-40 rounded-2xl border border-slate-300/90 bg-white/78 px-3 py-2.5 text-[11px] font-semibold text-slate-700 backdrop-blur-[2px]">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
          District status
        </div>
        <div className="space-y-1.5">
          {MAP_BUCKETS.map((bucket) => (
            <div key={bucket.label} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-[4px] border border-black/5"
                style={{ backgroundColor: toCss(getMapColor(bucket.sampleScore)) }}
              />
              <span>{bucket.label} {bucket.range}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
