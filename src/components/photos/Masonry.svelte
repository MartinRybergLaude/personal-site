<script lang="ts">
  import { largestUrl, imageUrl, srcset } from "./api";
  import type { Photo } from "./types";

  let { slug, photos, gap = 6 }: { slug: string; photos: Photo[]; gap?: number } = $props();

  let width = $state(0);

  const columnCount = $derived(
    width === 0 ? 1 : width < 640 ? 2 : width < 1024 ? 3 : width < 1600 ? 4 : 5,
  );

  /**
   * Greedy balanced masonry: each photo goes into the currently shortest
   * column. Aspect ratios are known from the manifest, so layout is exact
   * before any image has loaded and never shifts.
   */
  const columns = $derived.by(() => {
    const cols: Photo[][] = Array.from({ length: columnCount }, () => []);
    const heights = new Array<number>(columnCount).fill(0);
    for (const p of photos) {
      let target = 0;
      for (let i = 1; i < columnCount; i++) if (heights[i] < heights[target]) target = i;
      cols[target].push(p);
      heights[target] += p.height / p.width;
    }
    return cols;
  });

  const sizes = $derived(`calc((100vw - ${(columnCount + 1) * gap}px) / ${columnCount})`);

  /** Fade the image in once decoded, whether it was already cached or not. */
  function reveal(img: HTMLImageElement) {
    const show = () => {
      img.dataset.loaded = "true";
    };
    if (img.complete && img.naturalWidth > 0) show();
    else img.addEventListener("load", show, { once: true });
  }
</script>

<section
  bind:clientWidth={width}
  class="flex w-full"
  style={`gap: ${gap}px; padding: 0 ${gap}px`}
>
  {#if width > 0}
    {#each columns as column, i (i)}
      <div class="flex min-w-0 flex-1 flex-col" style={`gap: ${gap}px`}>
        {#each column as photo (photo.id)}
          <a
            href={largestUrl(slug, photo)}
            target="_blank"
            rel="noopener"
            class="block overflow-hidden"
            style={`aspect-ratio: ${photo.width} / ${photo.height}; background-color: ${photo.color}`}
          >
            <img
              src={imageUrl(slug, photo, photo.sizes[Math.min(1, photo.sizes.length - 1)])}
              srcset={srcset(slug, photo)}
              {sizes}
              alt={photo.caption ?? ""}
              width={photo.width}
              height={photo.height}
              loading="lazy"
              decoding="async"
              {@attach reveal}
              class="photo h-full w-full object-cover"
            />
          </a>
        {/each}
      </div>
    {/each}
  {/if}
</section>

<style>
  .photo {
    opacity: 0;
    transition: opacity 600ms ease-out;
  }
  /* Set from JS after decode, so Svelte cannot see it in the markup. */
  :global(.photo[data-loaded="true"]) {
    opacity: 1;
  }
</style>
