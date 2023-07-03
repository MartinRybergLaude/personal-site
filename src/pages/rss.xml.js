import rss from "@astrojs/rss";
import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";
import { fetchApi } from "../lib/strapi";

const parser = new MarkdownIt();

export async function get(context) {
  const posts = await fetchApi({
    endpoint: "devposts",
    wrappedByKey: "data",
  });
  posts.sort((a, b) => {
      return (
        new Date(b.attributes.pubDate).getTime() -
        new Date(a.attributes.pubDate).getTime()
      );
    })
  return rss({
    title: "Martin R. Laude's Blog",
    description: "Blog covering my journey in web development",
    site: context.site,
    items: blog.map((post) => ({
      title: post.attributes.title,
      pubDate: post.attributes.pubDate,
      description: post.attributes.description,
      link: `/blog/${post.attributes.slug}/`,
      content: sanitizeHtml(parser.render(post.attributes.content)),
    })),
  });
}
