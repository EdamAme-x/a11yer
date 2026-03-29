/**
 * Parses a hex color string to RGB components.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace(/^#/, "");
  const fullHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;

  const num = parseInt(fullHex, 16);
  if (isNaN(num)) return null;

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Calculates relative luminance per WCAG 2.0 definition.
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates the contrast ratio between two hex colors per WCAG 2.0.
 * Returns a value between 1 and 21.
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return 0;

  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks whether the contrast between foreground and background
 * meets the given minimum ratio.
 */
export function meetsContrastRatio(
  foreground: string,
  background: string,
  minRatio: number,
): boolean {
  return contrastRatio(foreground, background) >= minRatio;
}

/**
 * Returns the relative luminance (0–1) for a hex color.
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return relativeLuminance(rgb.r, rgb.g, rgb.b);
}

/**
 * Classifies a contrast ratio into WCAG conformance level.
 */
export function wcagLevel(ratio: number): "AAA" | "AA" | "fail" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "fail";
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert HSL values to RGB.
 * h: 0-360, s: 0-100, l: 0-100
 */
function hslToRgb(h: number, s: number, l: number): RGB {
  const s1 = s / 100;
  const l1 = l / 100;

  const c = (1 - Math.abs(2 * l1 - 1)) * s1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l1 - c / 2;

  let r1 = 0,
    g1 = 0,
    b1 = 0;

  if (h < 60) {
    r1 = c;
    g1 = x;
  } else if (h < 120) {
    r1 = x;
    g1 = c;
  } else if (h < 180) {
    g1 = c;
    b1 = x;
  } else if (h < 240) {
    g1 = x;
    b1 = c;
  } else if (h < 300) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

/**
 * Convert OKLab L, a, b to linear sRGB then to gamma-corrected sRGB.
 */
function oklabToRgb(L: number, a: number, b: number): RGB {
  // OKLab -> LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS -> linear sRGB
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  // Linear sRGB -> gamma-corrected sRGB
  const gamma = (c: number) =>
    c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

  return {
    r: Math.round(Math.min(255, Math.max(0, gamma(lr) * 255))),
    g: Math.round(Math.min(255, Math.max(0, gamma(lg) * 255))),
    b: Math.round(Math.min(255, Math.max(0, gamma(lb) * 255))),
  };
}

/**
 * Convert OKLCH (L, C, H) to OKLab then to RGB.
 * L: 0-1 (lightness), C: 0-0.4+ (chroma), H: 0-360 (hue degrees)
 */
function oklchToRgb(L: number, C: number, H: number): RGB {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  return oklabToRgb(L, a, b);
}

/**
 * Parses any CSS color string to RGB. Handles:
 * - Hex: #rgb, #rrggbb, #rgba, #rrggbbaa
 * - rgb(r, g, b) / rgba(r, g, b, a)
 * - hsl(h, s%, l%) / hsla(h, s%, l%, a)
 * - oklch(L C H) / oklch(L% C H)
 * - oklab(L a b)
 */
export function parseColorToRgb(color: string): RGB | null {
  if (!color || color === "transparent") return null;

  const trimmed = color.trim();

  // Hex format
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    const noAlpha =
      hex.length === 4
        ? hex.slice(0, 3)
        : hex.length === 8
          ? hex.slice(0, 6)
          : hex;
    return hexToRgb(`#${noAlpha}`);
  }

  // rgb() / rgba()
  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)/,
  );
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // hsl() / hsla()
  const hslMatch = trimmed.match(
    /^hsla?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)%?\s*[,\s]\s*([\d.]+)%?/,
  );
  if (hslMatch) {
    return hslToRgb(
      parseFloat(hslMatch[1]),
      parseFloat(hslMatch[2]),
      parseFloat(hslMatch[3]),
    );
  }

  // oklch()
  const oklchMatch = trimmed.match(
    /^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/,
  );
  if (oklchMatch) {
    let L = parseFloat(oklchMatch[1]);
    // If given as percentage (>1), normalize to 0-1
    if (L > 1) L = L / 100;
    const C = parseFloat(oklchMatch[2]);
    const H = parseFloat(oklchMatch[3]);
    return oklchToRgb(L, C, H);
  }

  // oklab()
  const oklabMatch = trimmed.match(
    /^oklab\(\s*([\d.]+)%?\s+([-\d.]+)\s+([-\d.]+)/,
  );
  if (oklabMatch) {
    let L = parseFloat(oklabMatch[1]);
    if (L > 1) L = L / 100;
    const a = parseFloat(oklabMatch[2]);
    const b = parseFloat(oklabMatch[3]);
    return oklabToRgb(L, a, b);
  }

  return null;
}

/**
 * Calculates contrast ratio using any CSS color strings.
 * Wraps contrastRatio with parseColorToRgb for broader format support.
 */
export function contrastRatioFromColors(
  color1: string,
  color2: string,
): number {
  const rgb1 = parseColorToRgb(color1);
  const rgb2 = parseColorToRgb(color2);
  if (!rgb1 || !rgb2) return 0;

  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Adjusts a foreground hex color toward black or white until
 * it meets the given contrast ratio against the background.
 * Returns the adjusted hex color string.
 */
export function suggestColor(
  fg: string,
  bg: string,
  minRatio: number,
): string {
  if (meetsContrastRatio(fg, bg, minRatio)) return fg;

  const bgRgb = hexToRgb(bg);
  const fgRgb = hexToRgb(fg);
  if (!bgRgb || !fgRgb) return fg;

  const bgLum = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  // Decide direction: darken if bg is light, lighten if bg is dark
  const direction = bgLum > 0.5 ? -1 : 1;

  let { r, g, b } = fgRgb;
  for (let i = 0; i < 255; i++) {
    r = Math.min(255, Math.max(0, r + direction));
    g = Math.min(255, Math.max(0, g + direction));
    b = Math.min(255, Math.max(0, b + direction));

    const fgLum = relativeLuminance(r, g, b);
    const lighter = Math.max(fgLum, bgLum);
    const darker = Math.min(fgLum, bgLum);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    if (ratio >= minRatio) {
      return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
    }
  }

  // Fallback: return black or white
  return direction === -1 ? "#000000" : "#ffffff";
}
