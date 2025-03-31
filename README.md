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
