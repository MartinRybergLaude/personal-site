# 🌟 Personal Website

A modern, fast, and responsive personal website built with Astro, featuring a blog and project showcase.

## 🚀 Technologies

This project is built with:

- [Astro](https://astro.build/) - The web framework for content-driven websites
- [Tailwind CSS](https://tailwindcss.com/) - For styling
- [MDX](https://mdxjs.com/) - For enhanced markdown content
- [TypeScript](https://www.typescriptlang.org/) - For type safety

## 📂 Project Structure

```
/
├── public/             # Static assets
├── src/
│   ├── assets/         # Images and other assets
│   ├── components/     # Reusable UI components
│   ├── content/        # Blog posts and other content
│   ├── layouts/        # Page layouts
│   ├── pages/          # Page components and routes
│   └── styles/         # Global styles
└── package.json        # Project dependencies and scripts
```

## 📝 Content

The website includes:

- Blog articles on web development, tooling, and tech topics
- Project showcases (Gamesquad, Solsken, Ultrawider)
- RSS feed for blog subscribers

## 🔧 Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Bun](https://bun.sh/) (for package management)

### Getting Started

1. Clone the repository

   ```bash
   git clone https://github.com/MartinRybergLaude/personal-site.git
   cd personal-site
   ```

2. Install dependencies

   ```bash
   bun install
   ```

3. Start the development server

   ```bash
   bun run dev
   ```

4. Open your browser and visit `http://localhost:4321`

## 🏗️ Building for Production

To create a production build:

```bash
bun run build
```

Preview the production build:

```bash
bun run preview
```

## 🌐 Deployment

The site is configured to be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

## 🔄 RSS Feed

An RSS feed is available at `/rss.xml` for users to subscribe to blog updates.

## 🎨 Customization

- Edit `src/consts.ts` to update site metadata
- Modify themes in `astro.config.mjs` to change code highlighting styles
- Add or modify content in the `src/content` directory

## 📄 License

European Union Public License 1.2

## 📷 Private photo collections

`/photos` is a private photography showcase. The pages are a static Astro shell
with a Svelte island; the data and images live in a Cloudflare R2 bucket and
are served by the Pages Function in `functions/photos/[[path]].ts`, which sits
behind Cloudflare Access. Nothing private is committed to this repository.

### One-time setup

1. **R2 bucket**: `bunx wrangler r2 bucket create personal-site-photos`
   (the binding is declared in `wrangler.toml`).
2. **Cloudflare Access**: in Zero Trust → Access → Applications, add a
   self-hosted application for `mrlaude.com` with path `photos`, a policy that
   allows your email (One-time PIN or GitHub), and a session length you like.
   Copy the team domain and the Application Audience (AUD) tag into `[vars]`
   in `wrangler.toml`. Until both are set, every `/photos/*` request is refused.
3. **R2 API token** (for publishing): create an R2 token with object read &
   write scoped to the bucket, then `cp .env.example .env` and fill in
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`.

### Publishing a collection

Put the photographs in a folder together with a `collection.json`:

```json
{
  "slug": "iceland-2025",
  "title": "Iceland",
  "description": "Ten days around the ring road.",
  "date": "2025-08",
  "location": "Iceland",
  "camera": "Leica Q3",
  "cover": "DSC01234.jpg"
}
```

Then run `bun run photos:publish ~/photos/iceland-2025`. The script resizes
every image to 480/960/1600/2400px WebP (EXIF stripped), writes a manifest,
uploads everything and updates the collection index. Add `--originals` to also
upload the untouched files. Re-running replaces the collection.

Camera and capture date are read from each photo's EXIF and shown in the
lightbox. Add `--geocode` to turn EXIF GPS coordinates into "Place, Country"
via OpenStreetMap (one request per second). Anything can be overridden per
photo in `collection.json`:

```json
"photos": {
  "DSC01234.jpg": { "caption": "Reynisfjara", "location": "Vík, Iceland", "camera": "Leica Q3", "date": "2025-08-14" }
}
```

Photos without their own location fall back to the collection's location.

### Previewing locally

```bash
cp .dev.vars.example .dev.vars          # enables the auth bypass for local dev only
bun run photos:publish <folder> --local # pushes into wrangler's local bucket
bun run photos:preview                  # http://127.0.0.1:8788/photos/
```
