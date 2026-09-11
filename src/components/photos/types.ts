export interface Photo {
  /** Stable id derived from the source filename. */
  id: string;
  /** Intrinsic dimensions of the largest derivative, used for layout before load. */
  width: number;
  height: number;
  /** Dominant colour, shown while the image loads. */
  color: string;
  /** Available derivative widths, ascending. */
  sizes: number[];
  /** Object key of the untouched original, if it was uploaded. */
  original?: string;
  caption?: string;
}

export interface CollectionSummary {
  slug: string;
  title: string;
  description?: string;
  /** ISO date: YYYY, YYYY-MM or YYYY-MM-DD. */
  date?: string;
  location?: string;
  camera?: string;
  count: number;
  cover: Photo;
}

export interface CollectionManifest {
  slug: string;
  title: string;
  description?: string;
  date?: string;
  location?: string;
  camera?: string;
  cover: string;
  photos: Photo[];
}

export interface CollectionsIndex {
  collections: CollectionSummary[];
}
