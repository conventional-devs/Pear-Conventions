// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
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
          items: [
            {
              label: "Finding Peers",
              slug: "the-book/1-foundations/finding-peers",
            },
            {
              label: "Key-Value Store",
              slug: "the-book/1-foundations/key-value-store",
            },
            { label: "Storage", slug: "the-book/1-foundations/storage" },
          ],
        },
        {
          label: "2. Building Blocks",
          items: [
            { label: "Overview", slug: "the-book/2-building-blocks/overview" },
            {
              label: "Database and Schema",
              slug: "the-book/2-building-blocks/db-and-schema",
            },
            {
              label: "Multi-Writer",
              slug: "the-book/2-building-blocks/multi-writer",
            },
            {
              label: "Simplified RPC",
              slug: "the-book/2-building-blocks/simplified-rpc",
            },
          ],
        },
        {
          label: "3. Bringing It All Together",
          items: [
            {
              label: "Overview",
              slug: "the-book/3_bringing_it_all_together/overview",
            },
          ],
        },
        {
          label: "4. Platforms",
          items: [
            {
              label: "Bare Expo",
              items: [
                {
                  label: "Pitfalls",
                  slug: "the-book/4_platforms/bare-expo/pitfalls",
                },
              ],
            },
            {
              label: "Electron",
              items: [
                {
                  label: "Fake Server",
                  slug: "the-book/4_platforms/electron/fake-server",
                },
                {
                  label: "HTML and JS",
                  slug: "the-book/4_platforms/electron/html-and-js",
                },
                { label: "React", slug: "the-book/4_platforms/electron/react" },
              ],
            },
          ],
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