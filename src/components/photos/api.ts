import type { Photo } from "./types";

const BASE = "/photos/api";

export class ApiError extends Error {
  constructor(public status: number) {
    super(`Request failed with status ${status}`);
  }
}

export async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: "same-origin" });
  if (!res.ok) throw new ApiError(res.status);
  return (await res.json()) as T;
}

export function imageUrl(slug: string, photo: Photo, width: number): string {
  return `${BASE}/img/${slug}/${photo.id}-${width}.webp`;
}

export function srcset(slug: string, photo: Photo): string {
  return photo.sizes.map((w) => `${imageUrl(slug, photo, w)} ${w}w`).join(", ");
}

export function largestUrl(slug: string, photo: Photo): string {
  if (photo.original) return `${BASE}/img/${slug}/${photo.original}`;
  return imageUrl(slug, photo, photo.sizes[photo.sizes.length - 1]);
}

/** Same style as the site's FormattedDate: browser locale, short month. */
export function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y) return iso;
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  const opts: Intl.DateTimeFormatOptions = d
    ? { year: "numeric", month: "short", day: "numeric" }
    : m
      ? { year: "numeric", month: "short" }
      : { year: "numeric" };
  return new Intl.DateTimeFormat(undefined, { ...opts, timeZone: "UTC" }).format(date);
}

export function routeFromPath(pathname: string): { slug: string | null } {
  const rest = pathname.replace(/^\/photos\/?/, "").replace(/\/+$/, "");
  return { slug: rest.length > 0 ? decodeURIComponent(rest) : null };
}
