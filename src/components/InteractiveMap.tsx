"use client";

import React, { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useRouter } from "next/navigation";

const geoUrl = "/maps/congressional-districts.json";

type DistrictGeo = {
  properties: {
    STATEFP?: string;
    CD118FP?: string;
  };
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

export default function InteractiveMap() {
  const router = useRouter();
  const [tooltipContent, setTooltipContent] = useState("");

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
                      fill: "#d7dde5",
                      outline: "none",
                      stroke: "#f7fafc",
                      strokeWidth: 0.55,
                      transition: "all 230ms ease"
                    },
                    hover: {
                      fill: "#b43f35",
                      outline: "none",
                      cursor: "pointer",
                      stroke: "#fff",
                      strokeWidth: 1
                    },
                    pressed: {
                      fill: "#8f2720",
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
        <div className="pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 bg-slate-900/70 px-4 py-1 text-sm font-semibold tracking-[0.12em] text-white uppercase">
          {tooltipContent}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 right-3 text-[11px] font-medium text-slate-700/90 [text-shadow:0_1px_10px_rgba(255,255,255,0.85)]">
        Pinch to zoom. Drag to pan.
      </div>
    </div>
  );
}
