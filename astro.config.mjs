import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

// https://astro.build/config
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://mrlaude.com",
  integrations: [sitemap(), react(), icon(), mdx()],
  markdown: {
    shikiConfig: {
      theme: "min-dark",
    },
  },
});
