export interface StyleOptions {
  maxWords?: number;
  minWords?: number;
  cta?: string;
}

const FEMALE_EGYPTIAN_MARKERS = [
  "بصي",
  "يا قمر",
  "يا حلوة",
  "حبيبتي",
  "جربي",
  "تحبي",
  "ممكن",
  "خليكي",
];

function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/u).length : 0;
}

export function styleScore(text: string): {
  words: number;
  withinTarget: boolean;
  feminineEgyptianSignal: boolean;
} {
  const words = wordCount(text);
  const feminineEgyptianSignal = FEMALE_EGYPTIAN_MARKERS.some((marker) =>
    text.toLowerCase().includes(marker.toLowerCase()),
  );

  return {
    words,
    withinTarget: words >= 8 && words <= 12,
    feminineEgyptianSignal,
  };
}

export function styleResponse(
  text: string,
  options: StyleOptions = {},
): string {
  const maxWords = options.maxWords ?? 12;
  const minWords = options.minWords ?? 8;
  const cta = options.cta?.trim();

  let result = text.trim().replace(/\s+/gu, " ");
  if (cta && !result.includes(cta)) result = `${result} ${cta}`.trim();

  const words = result.split(/\s+/u);
  if (words.length > maxWords) {
    result = words.slice(0, maxWords).join(" ");
  }

  if (wordCount(result) < minWords) {
    return result;
  }

  return result;
}

export const EGYPTIAN_FEMININE_FALLBACK =
  "مش متأكدة يا قمر، اسألي Enjy عشان أديكي رد موثوق.";
