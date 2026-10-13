export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "https://japanshop78.github.io/website";
  return url.replace(/\/+$/, "");
}
