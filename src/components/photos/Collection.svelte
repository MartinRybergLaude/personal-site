<script lang="ts">
  import { fetchJson, formatDate, imageUrl, srcset } from "./api";
  import type { CollectionManifest, Photo } from "./types";
  import Bento from "./Bento.svelte";
  import Button from "./Button.svelte";
  import Status from "./Status.svelte";

  let { slug }: { slug: string } = $props();

  let manifest = $state<CollectionManifest | null>(null);
  let error = $state<unknown>(null);

  $effect(() => {
    fetchJson<CollectionManifest>(`/collections/${encodeURIComponent(slug)}.json`)
      .then((data) => {
        manifest = data;
        document.title = `${data.title} — Photographs`;
      })
      .catch((e) => (error = e));
  });

  const cover = $derived.by<Photo | null>(() => {
    if (!manifest) return null;
    return manifest.photos.find((p) => p.id === manifest!.cover) ?? manifest.photos[0] ?? null;
  });

  const facts = $derived(
    manifest
      ? [
          ["Location", manifest.location],
          ["Camera", manifest.camera],
          ["Photographs", String(manifest.photos.length)],
        ].filter((f): f is [string, string] => Boolean(f[1]))
      : [],
  );
</script>

{#if error}
  <Status {error} />
{:else if manifest}
  <!-- Header in the article-page style: hero image, serif title, date, body. -->
  <header class="px-2 pt-14 pb-12 text-black md:px-6 dark:text-white">
    {#if cover}
      <div
        class="w-full overflow-hidden rounded"
        style={`aspect-ratio: ${cover.width} / ${cover.height}; background-color: ${cover.color}`}
      >
        <img
          src={imageUrl(slug, cover, 1600)}
          srcset={srcset(slug, cover)}
          sizes="(min-width: 768px) 720px, calc(100vw - 48px)"
          alt={manifest.title}
          width={cover.width}
          height={cover.height}
          fetchpriority="high"
          decoding="async"
          class="block h-full w-full"
        />
      </div>
    {/if}

    <div class="flex flex-col items-start gap-2 pt-12">
      <h1 class="font-serif text-3xl font-medium">{manifest.title}</h1>
      {#if manifest.date}
        <time datetime={manifest.date} class="text-sm text-nowrap">{formatDate(manifest.date)}</time>
      {/if}
    </div>

    {#if manifest.description}
      <p class="text-md mt-6 max-w-2xl font-light">{manifest.description}</p>
    {/if}

    <dl class="mt-6 flex flex-col gap-1 text-sm">
      {#each facts as [k, v] (k)}
        <div class="flex gap-3">
          <dt class="font-medium">{k}</dt>
          <dd class="font-light">{v}</dd>
        </div>
      {/each}
    </dl>
  </header>

  <Bento {slug} photos={manifest.photos} location={manifest.location} />

  <div class="px-2 py-14 md:px-6">
    <Button href="/photos/">All photographs →</Button>
  </div>
{/if}
