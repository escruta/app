export function getYouTubeVideoId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = url.match(regex);
  return match?.[1] ?? null;
}
