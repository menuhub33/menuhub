export type Rgb = { r: number; g: number; b: number };

export type LogoPalette = {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
};

const BLACK: Rgb = { r: 0, g: 0, b: 0 };
const WHITE: Rgb = { r: 255, g: 255, b: 255 };

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return {
    r: clamp(from.r + (to.r - from.r) * amount),
    g: clamp(from.g + (to.g - from.g) * amount),
    b: clamp(from.b + (to.b - from.b) * amount),
  };
}

function saturation(color: Rgb): number {
  const max = Math.max(color.r, color.g, color.b) / 255;
  const min = Math.min(color.r, color.g, color.b) / 255;
  if (max === 0) return 0;
  return (max - min) / max;
}

function luminance(color: Rgb): number {
  return (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b) / 255;
}

function hue(color: Rgb): number {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  let value = 0;
  if (max === r) value = ((g - b) / delta) % 6;
  else if (max === g) value = (b - r) / delta + 2;
  else value = (r - g) / delta + 4;
  value *= 60;
  return value < 0 ? value + 360 : value;
}

function channel(value: number): number {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

function contrast(a: Rgb, b: Rgb): number {
  const left = 0.2126 * channel(a.r) + 0.7152 * channel(a.g) + 0.0722 * channel(a.b);
  const right = 0.2126 * channel(b.r) + 0.7152 * channel(b.g) + 0.0722 * channel(b.b);
  const [hi, lo] = left > right ? [left, right] : [right, left];
  return (hi + 0.05) / (lo + 0.05);
}

function toHex(color: Rgb): string {
  const part = (value: number) => clamp(value).toString(16).padStart(2, "0");
  return `#${part(color.r)}${part(color.g)}${part(color.b)}`.toUpperCase();
}

/** Builds a menu palette from opaque logo pixels. Near-white pixels are ignored. */
export function paletteFromPixels(pixels: Rgb[]): LogoPalette | null {
  const useful = pixels.filter((pixel) => {
    const max = Math.max(pixel.r, pixel.g, pixel.b);
    const min = Math.min(pixel.r, pixel.g, pixel.b);
    return !(max > 245 && min > 230);
  });
  if (useful.length < 8) return null;

  const buckets = new Map<string, { color: Rgb; count: number }>();
  for (const pixel of useful) {
    const color = {
      r: Math.round(pixel.r / 16) * 16,
      g: Math.round(pixel.g / 16) * 16,
      b: Math.round(pixel.b / 16) * 16,
    };
    const key = `${color.r},${color.g},${color.b}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.count += 1;
    else buckets.set(key, { color, count: 1 });
  }

  const ranked = [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      score: bucket.count * (0.2 + saturation(bucket.color)),
    }))
    .sort((a, b) => b.score - a.score);

  let primary = ranked[0]?.color;
  if (!primary) return null;
  if (luminance(primary) > 0.78) primary = mix(primary, BLACK, 0.5);

  const primaryHue = hue(primary);
  const accent = ranked.slice(1).find((bucket) => {
    if (saturation(bucket.color) < 0.18 || luminance(bucket.color) > 0.85) return false;
    const distance = Math.abs(hue(bucket.color) - primaryHue);
    return Math.min(distance, 360 - distance) > 28;
  });

  const secondary = accent ? accent.color : mix(primary, BLACK, 0.32);
  const background = mix(primary, WHITE, 0.93);
  let text = mix(primary, BLACK, 0.78);
  if (contrast(text, background) < 4.5) text = { r: 24, g: 24, b: 27 };
  if (contrast(text, background) < 4.5) text = { r: 250, g: 250, b: 250 };

  return {
    primary_color: toHex(primary),
    secondary_color: toHex(secondary),
    background_color: toHex(background),
    text_color: toHex(text),
  };
}

function loadImage(url: string, sameOrigin: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (!sameOrigin) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("تعذر قراءة الشعار"));
    image.src = url;
  });
}

function sample(image: HTMLImageElement): Rgb[] {
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [];
  context.drawImage(image, 0, 0, size, size);
  const data = context.getImageData(0, 0, size, size).data;
  const pixels: Rgb[] = [];
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 180) continue;
    pixels.push({ r: data[index], g: data[index + 1], b: data[index + 2] });
  }
  return pixels;
}

/** Reads a logo file or URL and returns colors that stay readable on a menu. */
export async function paletteFromImageSource(source: File | string): Promise<LogoPalette | null> {
  const sameOrigin = typeof source !== "string";
  const url = sameOrigin ? URL.createObjectURL(source) : source;
  try {
    const image = await loadImage(url, sameOrigin);
    return paletteFromPixels(sample(image));
  } finally {
    if (sameOrigin) URL.revokeObjectURL(url);
  }
}
