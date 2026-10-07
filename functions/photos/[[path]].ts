/**
 * Everything under /photos/* goes through this function.
 *
 * Security model (defence in depth):
 *  1. Cloudflare Access sits in front of mrlaude.com/photos* at the edge and
 *     redirects anyone unauthenticated to a login page before they reach us.
 *  2. This function independently verifies the Access JWT that Cloudflare
 *     attaches to authenticated requests. If Access is misconfigured, the
 *     variables below are missing, or someone hits the *.pages.dev alias
 *     directly, every request fails closed with 401.
 *
 * Routes:
 *  GET /photos/api/collections.json          -> R2 collections.json
 *  GET /photos/api/collections/<slug>.json   -> R2 <slug>/manifest.json
 *  GET /photos/api/img/<slug>/<file>         -> R2 <slug>/<file>
 *  GET /photos/ and /photos/<slug>/          -> the static Astro shell
 */
import { createRemoteJWKSet, jwtVerify } from "jose";

interface Env {
  PHOTOS: R2Bucket;
  ASSETS: Fetcher;
  /** e.g. "mrlaude.cloudflareaccess.com" */
  ACCESS_TEAM_DOMAIN?: string;
  /** Application Audience (AUD) tag from the Access application. */
  ACCESS_AUD?: string;
  /** Only ever set in .dev.vars for `wrangler pages dev`. */
  PHOTOS_DEV_BYPASS?: string;
}

const SLUG = /^[a-z0-9][a-z0-9-]{0,80}$/;
const FILE = /^[a-z0-9][a-z0-9._-]{0,120}\.(webp|avif|jpe?g|png)$/i;

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function deny(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

async function authorize(request: Request, env: Env): Promise<Response | null> {
  if (env.PHOTOS_DEV_BYPASS === "true") return null;

  if (
    !env.ACCESS_TEAM_DOMAIN ||
    !env.ACCESS_AUD ||
    env.ACCESS_AUD.startsWith("<")
  ) {
    return deny(
      401,
      "Photos are private. Cloudflare Access is not configured for this deployment.",
    );
  }

  const token =
    request.headers.get("cf-access-jwt-assertion") ??
    readCookie(request, "CF_Authorization");
  if (!token) return deny(401, "Photos are private.");

  const issuer = `https://${env.ACCESS_TEAM_DOMAIN}`;
  let jwks = jwksCache.get(issuer);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    jwksCache.set(issuer, jwks);
  }

  try {
    await jwtVerify(token, jwks, { issuer, audience: env.ACCESS_AUD });
    return null;
  } catch {
    return deny(401, "Photos are private.");
  }
}

async function serveObject(
  request: Request,
  env: Env,
  key: string,
  fallbackType: string,
  cacheControl: string,
): Promise<Response> {
  const object = await env.PHOTOS.get(key, { onlyIf: request.headers });
  if (!object) return deny(404, "Not found");

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", fallbackType);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", cacheControl);
  headers.set("X-Robots-Tag", "noindex");

  // Precondition (If-None-Match) matched: R2 returns the metadata without a body.
  if (!("body" in object)) return new Response(null, { status: 304, headers });
  return new Response(object.body, { headers });
}

export const onRequest: PagesFunction<Env> = async ({
  request,
  env,
  params,
}) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return deny(405, "Method not allowed");
  }

  const denied = await authorize(request, env);
  if (denied) return denied;

  const segments = Array.isArray(params.path)
    ? params.path
    : params.path
      ? [params.path]
      : [];

  if (segments[0] === "api") {
    const [, kind, a, b] = segments;

    if (kind === "collections.json" && segments.length === 2) {
      return serveObject(
        request,
        env,
        "collections.json",
        "application/json",
        "private, no-cache",
      );
    }

    if (
      kind === "collections" &&
      segments.length === 3 &&
      a?.endsWith(".json")
    ) {
      const slug = a.slice(0, -".json".length);
      if (!SLUG.test(slug)) return deny(400, "Bad request");
      return serveObject(
        request,
        env,
        `${slug}/manifest.json`,
        "application/json",
        "private, no-cache",
      );
    }

    if (kind === "img" && segments.length === 4 && a && b) {
      if (!SLUG.test(a) || !FILE.test(b)) return deny(400, "Bad request");
      return serveObject(
        request,
        env,
        `${a}/${b}`,
        "image/webp",
        "private, max-age=31536000, immutable",
      );
    }

    return deny(404, "Not found");
  }

  // Any other path (/photos/, /photos/<slug>/) gets the static shell; the
  // client decides what to render from the URL. Never leak the Access-less
  // shell into a shared cache either.
  if (segments.length > 1 || (segments[0] && !SLUG.test(segments[0])))
    return deny(404, "Not found");

  const shell = await env.ASSETS.fetch(new URL("/photos/", request.url));
  const headers = new Headers(shell.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(shell.body, { status: shell.status, headers });
};
