// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightThemeObsidian from "starlight-theme-obsidian";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      plugins: [starlightThemeObsidian()],
      customCss: ["./src/styles/global.css"],
      title: "Pear Conventions",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/conventional-devs/Pear-Conventions",
        },
      ],
      sidebar: [
        {
          label: "The Book",
          items: [{ label: "Introduction", slug: "the-book/intro" }],
        },
        {
          label: "1. Foundations",
          autogenerate: { directory: "the-book/1-foundations" },
        },
        {
          label: "2. Building Blocks",
          autogenerate: { directory: "the-book/2-building-blocks" },
        },
        {
          label: "3. Bringing It All Together",
          autogenerate: { directory: "the-book/3_bringing_it_all_together" },
        },
        {
          label: "4. Platforms",
          autogenerate: { directory: "the-book/4_platforms" },
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
    }),
  ],

  adapter: vercel(),
});
