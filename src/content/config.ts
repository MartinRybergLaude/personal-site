import { z, defineCollection } from "astro:content";

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().or(z.literal("")).optional(),
    author: z.string(),
    layout: z.string(),
  }),
});

export const collections = {
  blog: blogCollection,
};
