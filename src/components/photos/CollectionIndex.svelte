<script lang="ts">
  import { fetchJson, formatDate, imageUrl, srcset } from "./api";
  import type { CollectionsIndex, CollectionSummary } from "./types";
  import Label from "./Label.svelte";
  import Status from "./Status.svelte";
  import TopBar from "./TopBar.svelte";

  let collections = $state<CollectionSummary[] | null>(null);
  let error = $state<unknown>(null);

  $effect(() => {
    fetchJson<CollectionsIndex>("/collections.json")
      .then((data) => (collections = data.collections))
      .catch((e) => (error = e));
  });

  function meta(c: CollectionSummary): string {
    return [c.location, formatDate(c.date), `${c.count} photographs`]
      .filter(Boolean)
      .join("  ·  ");
  }
</script>

<TopBar />

{#if error}
  <Status {error} />
{:else if collections}
  <header class="px-5 pt-16 pb-12 md:px-8 md:pt-24 md:pb-16">
    <Label muted>Collections</Label>
    <h1 class="mt-3 text-sm font-medium uppercase tracking-[0.18em]">
      Martin Ryberg Laude
    </h1>
  </header>

  {#if collections.length === 0}
    <div class="px-5 pb-24 md:px-8"><Label muted>No collections yet</Label></div>
  {:else}
    <ul class="grid grid-cols-1 gap-x-3 gap-y-12 px-5 pb-24 md:grid-cols-2 md:px-8 xl:grid-cols-3">
      {#each collections as c (c.slug)}
        <li>
          <a href={`/photos/${c.slug}/`} class="group block">
            <div
              class="aspect-[4/3] w-full overflow-hidden"
              style={`background-color: ${c.cover.color}`}
            >
              <img
                src={imageUrl(c.slug, c.cover, 960)}
                srcset={srcset(c.slug, c.cover)}
                sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                alt={c.title}
                width={c.cover.width}
                height={c.cover.height}
                loading="lazy"
                decoding="async"
                class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              />
            </div>
            <div class="mt-4 flex flex-col gap-1.5">
              <Label>{c.title}</Label>
              <Label muted>{meta(c)}</Label>
            </div>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
{/if}
