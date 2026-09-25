<script lang="ts">
  import { imageUrl, srcset } from "./api";
  import type { Photo } from "./types";
  import { compose, ratio } from "./bento";
  import Lightbox from "./Lightbox.svelte";

  let { slug, photos, gap = 12 }: { slug: string; photos: Photo[]; gap?: number } = $props();

  const blocks = $derived(compose(photos));
  const indexOf = $derived(new Map(photos.map((p, i) => [p.id, i])));

  let active = $state<number | null>(null);

  /** Fade the image in once decoded, whether it was already cached or not. */
  function reveal(img: HTMLImageElement) {
    const show = () => {
      img.dataset.loaded = "true";
    };
    if (img.complete && img.naturalWidth > 0) show();
    else img.addEventListener("load", show, { once: true });
  }

  /** Width share of a photo within a justified row, as a `sizes` hint. */
  function share(p: Photo, row: Photo[]): number {
    return ratio(p) / row.reduce((s, q) => s + ratio(q), 0);
  }
  function sizesFor(fraction: number): string {
    return `(min-width: 640px) ${Math.round(fraction * 100)}vw, 100vw`;
  }
  /** Width share of the tall photo in a stack block; the stack takes the rest. */
  function stackShare(tall: Photo, stack: [Photo, Photo]): number {
    const stackRatio = 1 / (1 / ratio(stack[0]) + 1 / ratio(stack[1]));
    return ratio(tall) / (ratio(tall) + stackRatio);
  }
</script>

{#snippet frame(photo: Photo, sizes: string, fill: boolean = false)}
  {@const index = indexOf.get(photo.id) ?? 0}
  <button
    type="button"
    class="cell block w-full cursor-zoom-in overflow-hidden"
    class:h-full={fill}
    style={fill ? `background-color: ${photo.color}` : `aspect-ratio: ${photo.width} / ${photo.height}; background-color: ${photo.color}`}
    aria-label={photo.caption ?? `Open photograph ${index + 1}`}
    onclick={() => (active = index)}
  >
    <img
      src={imageUrl(slug, photo, photo.sizes[Math.min(2, photo.sizes.length - 1)])}
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
  </button>
{/snippet}

<section class="flex w-full flex-col" style={`gap: ${gap}px; padding: 0 ${gap}px`}>
  {#each blocks as block, b (b)}
    {#if block.kind === "hero"}
      {@render frame(block.photo, "100vw")}
    {:else if block.kind === "row"}
      {#if block.photos.length === 1}
        <!-- A lone portrait: centred, no taller than the viewport. -->
        <div class="flex justify-center">
          <div style={`width: min(100%, calc(92vh * ${ratio(block.photos[0])}))`}>
            {@render frame(block.photos[0], sizesFor(0.6))}
          </div>
        </div>
      {:else}
        <div class="row flex flex-col sm:flex-row" style={`gap: ${gap}px`}>
          {#each block.photos as photo (photo.id)}
            <div class="row-item min-w-0" style={`--ar: ${ratio(photo)}`}>
              {@render frame(photo, sizesFor(share(photo, block.photos)))}
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      {@const tallShare = stackShare(block.tall, block.stack)}
      <div
        class="row flex flex-col sm:flex-row"
        class:sm:flex-row-reverse={block.side === "right"}
        style={`gap: ${gap}px`}
      >
        <div class="row-item min-w-0" style={`--ar: ${ratio(block.tall)}`}>
          {@render frame(block.tall, sizesFor(tallShare), true)}
        </div>
        <div
          class="row-item flex min-w-0 flex-col"
          style={`--ar: ${1 / (1 / ratio(block.stack[0]) + 1 / ratio(block.stack[1]))}; gap: ${gap}px`}
        >
          {#each block.stack as photo (photo.id)}
            {@render frame(photo, sizesFor(1 - tallShare))}
          {/each}
        </div>
      </div>
    {/if}
  {/each}
</section>

{#if active !== null}
  <Lightbox
    {slug}
    {photos}
    index={active}
    onclose={() => (active = null)}
    onnavigate={(i) => (active = i)}
  />
{/if}

<style>
  /*
   * Justified rows: each item's flex-grow is its aspect ratio, so widths are
   * proportional to ratios and, with aspect-ratio set on the cells, every
   * item in a row ends up the same height.
   */
  @media (min-width: 640px) {
    .row-item {
      flex: var(--ar) 1 0%;
    }
  }
  .photo {
    opacity: 0;
    transition: opacity 600ms ease-out;
  }
  /* Set from JS after decode, so Svelte cannot see it in the markup. */
  :global(.photo[data-loaded="true"]) {
    opacity: 1;
  }
</style>
