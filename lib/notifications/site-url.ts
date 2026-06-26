export function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}
