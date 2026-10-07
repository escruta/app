const relativeTimeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "";

  const timestamp = new Date(date).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diff = timestamp - Date.now();

  for (const [unit, milliseconds] of TIME_UNITS) {
    if (Math.abs(diff) >= milliseconds) {
      return relativeTimeFormat.format(Math.round(diff / milliseconds), unit);
    }
  }

  return relativeTimeFormat.format(Math.round(diff / 1000), "second");
}
