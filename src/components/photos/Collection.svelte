<script lang="ts">
  import { fetchJson, formatDate, imageUrl, srcset } from "./api";
  import type { CollectionManifest, Photo } from "./types";
  import Label from "./Label.svelte";
  import Masonry from "./Masonry.svelte";
  import Status from "./Status.svelte";
  import TopBar from "./TopBar.svelte";

  let { slug }: { slug: string } = $props();

  let manifest = $state<CollectionManifest | null>(null);
  let error = $state<unknown>(null);

  $effect(() => {
    fetchJson<CollectionManifest>(`/collections/${encodeURIComponent(slug)}.json`)
      .then((data) => {
        manifest = data;
        document.title = `${data.title} — Photos`;
      })
      .catch((e) => (error = e));
  });

  const cover = $derived.by<Photo | null>(() => {
    if (!manifest) return null;
    return manifest.photos.find((p) => p.id === manifest!.cover) ?? manifest.photos[0] ?? null;
  });

  const facts = $derived.by(() => {
    if (!manifest) return [];
    return [
      { k: "Location", v: manifest.location },
      { k: "Date", v: formatDate(manifest.date) },
      { k: "Camera", v: manifest.camera },
      { k: "Photographs", v: String(manifest.photos.length) },
    ].filter((f): f is { k: string; v: string } => Boolean(f.v));
  });
</script>

<TopBar back={{ href: "/photos/", label: "Collections" }} />

{#if error}
  <Status {error} />
{:else if manifest}
  <header>
    {#if cover}
      <div
        class="h-[62vh] w-full overflow-hidden md:h-[78vh]"
        style={`background-color: ${cover.color}`}
      >
        <img
          src={imageUrl(slug, cover, 1600)}
          srcset={srcset(slug, cover)}
          sizes="100vw"
          alt={manifest.title}
          width={cover.width}
          height={cover.height}
          fetchpriority="high"
          decoding="async"
          class="h-full w-full object-cover"
        />
      </div>
    {/if}

    <div
      class="mx-auto flex max-w-3xl flex-col items-center gap-8 px-5 pt-14 pb-16 text-center md:pt-20 md:pb-24"
    >
      <h1 class="text-sm font-medium uppercase tracking-[0.22em]">{manifest.title}</h1>

      {#if manifest.description}
        <p class="max-w-xl text-[13px] leading-relaxed text-stone-600 dark:text-stone-400">
          {manifest.description}
        </p>
      {/if}

      <dl class="flex flex-wrap items-baseline justify-center gap-x-8 gap-y-3">
        {#each facts as f (f.k)}
          <div class="flex items-baseline gap-2">
            <dt><Label muted>{f.k}</Label></dt>
            <dd><Label>{f.v}</Label></dd>
          </div>
        {/each}
      </dl>
    </div>
  </header>

  <Masonry {slug} photos={manifest.photos} />

  <footer class="flex justify-center px-5 py-16">
    <a href="/photos/" class="group">
      <Label muted class="transition-colors group-hover:text-stone-900 dark:group-hover:text-stone-100">
        &larr; All collections
      </Label>
    </a>
  </footer>
{/if}
