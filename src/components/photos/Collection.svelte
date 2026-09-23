<script lang="ts">
  import { fetchJson, formatDate, imageUrl, srcset } from "./api";
  import type { CollectionManifest, Photo } from "./types";
  import Container from "./Container.svelte";
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
  <Container>
    <!--
      Header: the cover photograph shown uncropped at its own aspect ratio,
      with the metadata beside it on desktop and below it on narrow screens.
    -->
    <header
      class="grid grid-cols-1 items-start gap-8 pt-10 pb-16 md:grid-cols-[minmax(0,1fr)_13rem] md:gap-10 md:pt-16 md:pb-20"
    >
      {#if cover}
        <div
          class="w-full"
          style={`aspect-ratio: ${cover.width} / ${cover.height}; background-color: ${cover.color}`}
        >
          <img
            src={imageUrl(slug, cover, 960)}
            srcset={srcset(slug, cover)}
            sizes="(min-width: 768px) 496px, calc(100vw - 32px)"
            alt={manifest.title}
            width={cover.width}
            height={cover.height}
            fetchpriority="high"
            decoding="async"
            class="block h-full w-full"
          />
        </div>
      {/if}

      <aside class="flex flex-col gap-6">
        <h1><Label weight="bold">{manifest.title}</Label></h1>

        {#if manifest.description}
          <p class="text-[13px] leading-relaxed font-light">{manifest.description}</p>
        {/if}

        <dl class="flex flex-col gap-2">
          {#each facts as f (f.k)}
            <div class="flex flex-col gap-0.5">
              <dt><Label weight="light">{f.k}</Label></dt>
              <dd><Label>{f.v}</Label></dd>
            </div>
          {/each}
        </dl>
      </aside>
    </header>
  </Container>

  <Masonry {slug} photos={manifest.photos} />

  <Container>
    <footer class="flex justify-center py-16">
      <a href="/photos/" class="underline-offset-4 hover:underline">
        <Label weight="light">&larr; All collections</Label>
      </a>
    </footer>
  </Container>
{/if}
