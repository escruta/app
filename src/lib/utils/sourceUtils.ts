export function getYouTubeVideoId(url: string): string | null {
  const regexes = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/i,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/i,
  ];

  for (const regex of regexes) {
    const match = url.match(regex);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}
