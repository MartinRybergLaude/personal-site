// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  site: "https://mrlaude.com",
  integrations: [mdx(), sitemap(), svelte()],
  redirects: {
    "/jetline": "https://martinryberglaude.github.io/jetline/",
  },

  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: "vitesse-light",
        dark: "poimandres",
      },
    },
  },
  prefetch: {
    defaultStrategy: "viewport",
    prefetchAll: true,
  },
});