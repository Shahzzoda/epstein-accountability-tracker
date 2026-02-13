# District Map Asset Pipeline

This project uses a local, free map asset pipeline for U.S. congressional districts.

## Source
- Provider: U.S. Census Bureau TIGERweb ArcGIS service
- Layer: `TIGERweb/Legislative/MapServer/0`
- Vintage: `119th Congressional Districts` (January 1, 2025)
- Public-domain source data (federal government work)

## Strategy
- Generate all district map images once and store them in `public/maps/districts/png` and `public/maps/districts/svg`.
- Serve the images directly from Next.js static assets.
- Keep a manifest file in each folder (`manifest.json`) to map `STATE-district` keys to file paths.

## Current output format
- Raster format: `PNG` (transparent, line-only)
- Vector format: `SVG` (line-only)
- Canvas: `1200x675`
- One file per district, named `STATE-district.png` and `STATE-district.svg` (examples: `CA-12.png`, `CA-12.svg`)

## Commands
- Generate all PNG maps:
  - `npm run maps:districts:png`
- Generate all SVG maps:
  - `npm run maps:districts:svg`
- Generate one district sample:
  - `npm run maps:districts:png -- --state=CA --district=12`
  - `npm run maps:districts:svg -- --state=CA --district=12`

## Notes
- At-large districts are normalized to district `0` (for example `WY-0`).
- PNG images use transparent background and outline-only rendering from Census MapServer export.
- SVG images are generated locally from Census geometry and draw state district outlines plus emphasized target district.
