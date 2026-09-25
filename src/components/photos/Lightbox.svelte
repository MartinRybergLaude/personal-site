<script lang="ts">
  import { imageUrl, srcset } from "./api";
  import type { Photo } from "./types";
  import Label from "./Label.svelte";

  let {
    slug,
    photos,
    index,
    onclose,
    onnavigate,
  }: {
    slug: string;
    photos: Photo[];
    index: number;
    onclose: () => void;
    onnavigate: (index: number) => void;
  } = $props();

  const photo = $derived(photos[index]);
  const hasPrev = $derived(index > 0);
  const hasNext = $derived(index < photos.length - 1);

  function prev() {
    if (hasPrev) onnavigate(index - 1);
  }
  function next() {
    if (hasNext) onnavigate(index + 1);
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onclose();
    else if (e.key === "ArrowLeft") prev();
    else if (e.key === "ArrowRight") next();
  }

  // Lock page scroll while open and warm the neighbours so paging is instant.
  $effect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  });

  $effect(() => {
    for (const i of [index - 1, index + 1]) {
      const p = photos[i];
      if (p) new Image().src = imageUrl(slug, p, p.sizes[p.sizes.length - 1]);
    }
  });

  let touchStartX = 0;
  function ontouchstart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
  }
  function ontouchend(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 48) (dx < 0 ? next : prev)();
  }
</script>

<svelte:window {onkeydown} />

<div
  class="fixed inset-0 z-50 flex flex-col bg-[#f5f4f0] dark:bg-[#10100e]"
  role="dialog"
  aria-modal="true"
  aria-label={photo.caption ?? `Photograph ${index + 1} of ${photos.length}`}
  {ontouchstart}
  {ontouchend}
>
  <div class="flex items-center justify-between px-5 py-6 md:px-8">
    <button type="button" class="cursor-pointer underline-offset-4 hover:underline" onclick={onclose}>
      <Label weight="light">&larr; Close</Label>
    </button>
    <Label weight="light">{index + 1} / {photos.length}</Label>
  </div>

  <div class="relative flex min-h-0 flex-1 items-center justify-center px-5 pb-6 md:px-8 md:pb-8">
    {#key photo.id}
      <img
        src={imageUrl(slug, photo, photo.sizes[photo.sizes.length - 1])}
        srcset={srcset(slug, photo)}
        sizes="100vw"
        alt={photo.caption ?? ""}
        width={photo.width}
        height={photo.height}
        decoding="async"
        class="lightbox-photo max-h-full max-w-full object-contain"
        style={`aspect-ratio: ${photo.width} / ${photo.height}`}
      />
    {/key}

    <!-- Invisible paging zones: left third goes back, right two thirds go forward. -->
    <button
      type="button"
      class="absolute inset-y-0 left-0 w-1/3 cursor-w-resize disabled:cursor-default"
      aria-label="Previous photograph"
      disabled={!hasPrev}
      onclick={prev}
    ></button>
    <button
      type="button"
      class="absolute inset-y-0 right-0 w-2/3 cursor-e-resize disabled:cursor-default"
      aria-label="Next photograph"
      disabled={!hasNext}
      onclick={next}
    ></button>
  </div>

  {#if photo.caption}
    <div class="px-5 pb-6 text-center md:px-8">
      <Label weight="light">{photo.caption}</Label>
    </div>
  {/if}
</div>

<style>
  .lightbox-photo {
    animation: lightbox-in 300ms ease-out;
  }
  @keyframes lightbox-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
