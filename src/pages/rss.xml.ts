import rss from "@astrojs/rss";
import sanitizeHtml from "sanitize-html";
import fetchApi from "../lib/strapi";
import { Marked } from "marked";
import type Post from "../interfaces/post";

export async function GET(context: any) {
  const marked = new Marked();
  const posts = await fetchApi<Post[]>({
    endpoint: "devposts",
    wrappedByKey: "data",
  });
  posts.sort((a, b) => {
    return (
      new Date(b.attributes.pubDate).getTime() -
      new Date(a.attributes.pubDate).getTime()
    );
  });
  return rss({
    title: "Martin R. Laude's Blog",
    description: "Blog covering my journey in web development",
    site: context.site,
    items: posts.map((post) => ({
      title: post.attributes.title,
      pubDate: post.attributes.pubDate,
      description: post.attributes.description,
      link: `/blog/${post.attributes.slug}/`,
      content: sanitizeHtml(marked.parse(post.attributes.content)),
    })),
  });
}
