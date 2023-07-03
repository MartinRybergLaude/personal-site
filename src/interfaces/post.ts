export default interface Post {
  id: number;
  attributes: {
    title: string;
    description: string;
    content: string;
    slug: string;
    author: string;
    pubDate: Date;
    updateDate: Date;
  };
}