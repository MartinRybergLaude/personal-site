/**
 * Process a folder of photographs into a private collection and upload it to R2.
 *
 *   pnpm photos:publish <folder> [--local] [--originals] [--skip-upload] [--geocode]
 *   (runs under Node, which is required for sharp)
 *
 * <folder> must contain a collection.json:
 *   {
 *     "slug": "iceland-2025",            // lowercase, a-z 0-9 and dashes
 *     "title": "Iceland",
 *     "description": "Ten days around the ring road.",
 *     "date": "2025-08",                 // YYYY, YYYY-MM or YYYY-MM-DD
 *     "location": "Iceland",
 *     "camera": "Leica Q3",
 *     "cover": "DSC01234.jpg",           // filename in the folder (default: first)
 *     "photos": {                        // optional per-photo overrides
 *       "DSC01234.jpg": { "caption": "...", "location": "...", "camera": "...", "date": "2025-08-14" }
 *     }
 *   }
 * plus the .jpg / .jpeg / .png / .tif files, ordered by filename.
 *
 * Camera and capture date are read from EXIF. With --geocode, GPS coordinates
 * are reverse-geocoded to "Place, Country" via OpenStreetMap Nominatim (one
 * request per second, cached per run). Overrides in collection.json win.
 *
 * Derivatives are written to .photos-out/<slug>/ and uploaded together with
 * manifest.json; collections.json in the bucket is updated to include the
 * collection. EXIF (including GPS) is stripped from every derivative.
 *
 * Remote upload needs an R2 API token with object read/write:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (and optionally R2_BUCKET)
 * --local instead pushes into the wrangler local bucket for `pnpm photos:preview`.
 */
import {
  readdir,
  mkdir,
  readFile,
  writeFile,
  copyFile,
} from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  NoSuchKey,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import exifReader from "exif-reader";

const execFileAsync = promisify(execFile);

type Photo = {
  id: string;
  width: number;
  height: number;
  color: string;
  sizes: number[];
  original?: string;
  caption?: string;
  camera?: string;
  location?: string;
  /** ISO date YYYY-MM-DD. */
  date?: string;
};

type PhotoOverrides = Partial<Pick<Photo, "caption" | "location" | "camera" | "date">>;

type CollectionConfig = {
  slug: string;
  title: string;
  description?: string;
  date?: string;
  location?: string;
  camera?: string;
  cover?: string;
  /** Legacy: filename -> caption. Prefer `photos`. */
  captions?: Record<string, string>;
  photos?: Record<string, PhotoOverrides>;
};

const WIDTHS = [480, 960, 1600, 2400];
const QUALITY = 82;
const CONCURRENCY = 4;
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff"]);
const OUT_ROOT = resolve(".photos-out");
const BUCKET = process.env.R2_BUCKET ?? "personal-site-photos";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const folder = args.find((a) => !a.startsWith("--"));
if (!folder) {
  console.error(
    "usage: pnpm photos:publish <folder> [--local] [--originals] [--skip-upload]",
  );
  process.exit(1);
}
const LOCAL = flags.has("--local");
const GEOCODE = flags.has("--geocode");
const ORIGINALS = flags.has("--originals");
const SKIP_UPLOAD = flags.has("--skip-upload");

// ---------- storage backends ----------

interface Store {
  put(key: string, file: string, contentType: string): Promise<void>;
  getJson<T>(key: string): Promise<T | null>;
}

function s3Store(): Store {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error(
      "Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY (or use --local).",
    );
  }
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  return {
    async put(key, file, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: await readFile(file),
          ContentType: contentType,
        }),
      );
    },
    async getJson(key) {
      try {
        const res = await client.send(
          new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        );
        return JSON.parse((await res.Body!.transformToString()) as string);
      } catch (e) {
        if (e instanceof NoSuchKey) return null;
        throw e;
      }
    },
  };
}

function wranglerLocalStore(): Store {
  // The local bucket is a single sqlite database, so writes must be sequential.
  async function run(cmd: string[]): Promise<boolean> {
    try {
      await execFileAsync("pnpm", ["exec", "wrangler", ...cmd, "--local"], {
        maxBuffer: 1 << 24,
      });
      return true;
    } catch (e) {
      const err = e as { stderr?: string };
      if (err.stderr && !/not found|does not exist/i.test(err.stderr))
        console.error(err.stderr.trim());
      return false;
    }
  }
  return {
    async put(key, file, contentType) {
      const ok = await run([
        "r2",
        "object",
        "put",
        `${BUCKET}/${key}`,
        "--file",
        file,
        "--content-type",
        contentType,
      ]);
      if (!ok) throw new Error(`wrangler put failed for ${key}`);
    },
    async getJson(key) {
      const tmp = join(OUT_ROOT, `.tmp-${basename(key)}`);
      if (
        !(await run(["r2", "object", "get", `${BUCKET}/${key}`, "--file", tmp]))
      )
        return null;
      try {
        return JSON.parse(await readFile(tmp, "utf8"));
      } catch {
        return null;
      }
    },
  };
}

// ---------- helpers ----------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hex({ r, g, b }: { r: number; g: number; b: number }): string {
  return (
    "#" +
    [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")
  );
}

async function pool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, i: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    }),
  );
  return results;
}

// ---------- exif ----------

type Exif = { camera?: string; date?: string; lat?: number; lon?: number };

function dmsToDecimal(dms: number[] | undefined, ref: string | undefined): number | undefined {
  if (!dms || dms.length < 2) return undefined;
  const [d, m = 0, sec = 0] = dms;
  const value = d + m / 60 + sec / 3600;
  return ref === "S" || ref === "W" ? -value : value;
}

function cameraName(make?: string, model?: string): string | undefined {
  const mk = make?.trim();
  const md = model?.trim();
  if (!md) return mk || undefined;
  if (!mk) return md;
  // "LEICA CAMERA AG" + "LEICA Q3" -> "LEICA Q3"; "SONY" + "ILCE-7M4" -> "SONY ILCE-7M4".
  const brand = mk.split(/\s+/)[0].toLowerCase();
  return md.toLowerCase().startsWith(brand) ? md : `${mk.split(/\s+/)[0]} ${md}`;
}

function readExif(buffer: Buffer | undefined): Exif {
  if (!buffer) return {};
  try {
    const exif = exifReader(buffer) as any;
    const taken: Date | string | undefined = exif.Photo?.DateTimeOriginal ?? exif.Image?.DateTime;
    let date: string | undefined;
    if (taken instanceof Date && !isNaN(taken.valueOf())) date = taken.toISOString().slice(0, 10);
    else if (typeof taken === "string") date = taken.slice(0, 10).replace(/:/g, "-");
    return {
      camera: cameraName(exif.Image?.Make, exif.Image?.Model),
      date,
      lat: dmsToDecimal(exif.GPSInfo?.GPSLatitude, exif.GPSInfo?.GPSLatitudeRef),
      lon: dmsToDecimal(exif.GPSInfo?.GPSLongitude, exif.GPSInfo?.GPSLongitudeRef),
    };
  } catch {
    return {};
  }
}

// ---------- reverse geocoding (opt-in) ----------

const geocodeCache = new Map<string, string | undefined>();
let geocodeQueue: Promise<unknown> = Promise.resolve();

/** "Place, Country" for a coordinate, via Nominatim at their 1 req/s limit. */
function geocode(lat: number, lon: number): Promise<string | undefined> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  if (geocodeCache.has(key)) return Promise.resolve(geocodeCache.get(key));
  const task = geocodeQueue.then(async () => {
    if (geocodeCache.has(key)) return geocodeCache.get(key);
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=10&accept-language=en`;
    let place: string | undefined;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "personal-site-photos-publish/1.0" } });
      if (res.ok) {
        const a = ((await res.json()) as any).address ?? {};
        const local = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? a.state;
        place = [local, a.country].filter(Boolean).join(", ") || undefined;
      }
    } catch {
      /* leave undefined */
    }
    geocodeCache.set(key, place);
    await new Promise((r) => setTimeout(r, 1100));
    return place;
  });
  geocodeQueue = task.catch(() => {});
  return task;
}

// ---------- processing ----------

async function processPhoto(
  src: string,
  outDir: string,
  config: CollectionConfig,
): Promise<Photo> {
  const stem = basename(src, extname(src));
  const id = slugify(stem);
  const base = sharp(src, { failOn: "none" }).rotate(); // apply EXIF orientation
  const meta = await base.metadata();
  const exif = readExif(meta.exif);
  const swap = (meta.orientation ?? 1) >= 5;
  const srcWidth = swap ? meta.height! : meta.width!;

  // Only produce derivatives up to the source width, but always at least one.
  let widths = WIDTHS.filter((w) => w <= srcWidth);
  if (widths.length === 0) widths = [Math.min(WIDTHS[0], srcWidth)];

  let largest = { width: 0, height: 0 };
  for (const w of widths) {
    const info = await base
      .clone()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(join(outDir, `${id}-${w}.webp`));
    if (info.width > largest.width)
      largest = { width: info.width, height: info.height };
  }

  const { dominant } = await base.clone().stats();

  const photo: Photo = {
    id,
    width: largest.width,
    height: largest.height,
    color: hex(dominant),
    sizes: widths,
  };
  if (ORIGINALS) {
    const ext = extname(src).toLowerCase().replace("jpeg", "jpg");
    photo.original = `${id}${ext}`;
    await copyFile(src, join(outDir, photo.original));
  }
  const file = basename(src);
  const overrides: PhotoOverrides = { ...config.photos?.[file] };
  if (config.captions?.[file]) overrides.caption ??= config.captions[file];

  photo.caption = overrides.caption;
  photo.camera = overrides.camera ?? exif.camera;
  photo.date = overrides.date ?? exif.date;
  photo.location = overrides.location;
  if (!photo.location && GEOCODE && exif.lat !== undefined && exif.lon !== undefined) {
    photo.location = await geocode(exif.lat, exif.lon);
  }
  for (const k of ["caption", "camera", "date", "location"] as const) if (!photo[k]) delete photo[k];
  return photo;
}

async function main() {
  const dir = resolve(folder!);
  const config: CollectionConfig = JSON.parse(
    await readFile(join(dir, "collection.json"), "utf8"),
  );
  if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(config.slug))
    throw new Error(`Invalid slug "${config.slug}"`);
  if (!config.title) throw new Error("collection.json needs a title");

  const files = (await readdir(dir))
    .filter(
      (f) => EXTENSIONS.has(extname(f).toLowerCase()) && !f.startsWith("."),
    )
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => join(dir, f));
  if (files.length === 0) throw new Error("No images found");

  const outDir = join(OUT_ROOT, config.slug);
  await mkdir(outDir, { recursive: true });

  console.log(
    `Processing ${files.length} photographs for "${config.title}" (${config.slug})`,
  );
  const photos = await pool(files, CONCURRENCY, async (file, i) => {
    const photo = await processPhoto(file, outDir, config);
    console.log(
      `  [${String(i + 1).padStart(3)}/${files.length}] ${basename(file)} -> ${photo.id} (${photo.width}x${photo.height})`,
    );
    return photo;
  });

  const coverFile = config.cover ?? basename(files[0]);
  const cover =
    photos.find(
      (p) => p.id === slugify(basename(coverFile, extname(coverFile))),
    ) ?? photos[0];

  const manifest = {
    slug: config.slug,
    title: config.title,
    description: config.description,
    date: config.date,
    location: config.location,
    camera: config.camera,
    cover: cover.id,
    photos,
  };
  await writeFile(
    join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  if (SKIP_UPLOAD) {
    console.log(`Wrote ${outDir}. Skipping upload.`);
    return;
  }

  const store = LOCAL ? wranglerLocalStore() : s3Store();

  const uploads = (await readdir(outDir)).filter((f) => !f.startsWith("."));
  console.log(
    `Uploading ${uploads.length} objects to ${LOCAL ? "local" : "remote"} bucket "${BUCKET}"`,
  );
  await pool(uploads, LOCAL ? 1 : 8, async (f, i) => {
    const ext = extname(f).toLowerCase();
    const type =
      ext === ".webp"
        ? "image/webp"
        : ext === ".json"
          ? "application/json"
          : ext === ".png"
            ? "image/png"
            : ext === ".jpg"
              ? "image/jpeg"
              : "application/octet-stream";
    await store.put(`${config.slug}/${f}`, join(outDir, f), type);
    if ((i + 1) % 25 === 0 || i + 1 === uploads.length)
      console.log(`  ${i + 1}/${uploads.length}`);
  });

  // Update the index of collections.
  const index = (await store.getJson<{ collections: unknown[] }>(
    "collections.json",
  )) ?? { collections: [] };
  const summary = {
    slug: config.slug,
    title: config.title,
    description: config.description,
    date: config.date,
    location: config.location,
    camera: config.camera,
    count: photos.length,
    cover,
  };
  const others = (index.collections as { slug: string }[]).filter(
    (c) => c.slug !== config.slug,
  );
  const collections = [...others, summary].sort((a: any, b: any) =>
    (b.date ?? "").localeCompare(a.date ?? ""),
  );
  const indexPath = join(outDir, ".collections.json");
  await writeFile(indexPath, JSON.stringify({ collections }, null, 2));
  await store.put("collections.json", indexPath, "application/json");

  console.log(`Done. ${collections.length} collection(s) in the index.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
