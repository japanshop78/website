export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "https://donoidianhat100.com";
  return url.replace(/\/+$/, "");
}
