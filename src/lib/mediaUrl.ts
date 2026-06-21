/** Corrige URLs de MinIO generadas con prefijo …/media/rutek-media (doble bucket tras nginx). */
export function normalizeMediaUrl(url: string): string {
  if (!url) return url;
  return url.replace('/media/rutek-media/', '/media/');
}
