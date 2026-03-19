type RgbColor = {
  r: number;
  g: number;
  b: number;
};

const SCORE_TEXT_THRESHOLDS = {
  supportive: 3,
  minimal: 2
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mix(a: RgbColor, b: RgbColor, weight: number): RgbColor {
  const w = clamp(weight, 0, 1);
  return {
    r: Math.round(a.r + (b.r - a.r) * w),
    g: Math.round(a.g + (b.g - a.g) * w),
    b: Math.round(a.b + (b.b - a.b) * w)
  };
}

function hueToRgb(p: number, q: number, t: number) {
  let value = t;
  if (value < 0) value += 1;
  if (value > 1) value -= 1;
  if (value < 1 / 6) return p + (q - p) * 6 * value;
  if (value < 1 / 2) return q;
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): RgbColor {
  const hue = clamp(h, 0, 360) / 360;
  const saturation = clamp(s, 0, 1);
  const lightness = clamp(l, 0, 1);

  if (saturation === 0) {
    const channel = Math.round(lightness * 255);
    return { r: channel, g: channel, b: channel };
  }

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    r: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hue) * 255),
    b: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255)
  };
}

export function getScoreTextColorClass(score: number) {
  if (score > SCORE_TEXT_THRESHOLDS.supportive) return "text-green-700";
  if (score > SCORE_TEXT_THRESHOLDS.minimal) return "text-yellow-600";
  return "text-red-700";
}

export function getScoreRgb(score?: number) {
  if (typeof score !== "number") return null;

  const normalizedScore = clamp(score, 0, 5);
  const hue = (normalizedScore / 5) * 120;
  return hslToRgb(hue, 0.78, 0.45);
}

export function mixScoreColor(score: number | undefined, other: RgbColor, weight: number) {
  const base = getScoreRgb(score);
  if (!base) return null;
  return mix(base, other, weight);
}

export function toCss(color: RgbColor) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

export function getScoreGradientCss() {
  const stops = [0, 2.5, 5].map((score) => `${toCss(getScoreRgb(score) ?? SCORE_UI_COLORS.neutral)} ${(score / 5) * 100}%`);
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

export const SCORE_UI_COLORS = {
  neutral: { r: 203, g: 213, b: 225 },
  light: { r: 255, g: 255, b: 255 },
  dark: { r: 15, g: 23, b: 42 }
} as const;
