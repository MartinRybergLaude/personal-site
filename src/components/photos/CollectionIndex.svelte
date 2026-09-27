<script lang="ts">
  import { fetchJson, formatDate, imageUrl, srcset } from "./api";
  import type { CollectionsIndex, CollectionSummary } from "./types";
  import Status from "./Status.svelte";

  let collections = $state<CollectionSummary[] | null>(null);
  let error = $state<unknown>(null);

  $effect(() => {
    fetchJson<CollectionsIndex>("/collections.json")
      .then((data) => (collections = data.collections))
      .catch((e) => (error = e));
  });

  function meta(c: CollectionSummary): string {
    return [c.location, `${c.count} photographs`].filter(Boolean).join(" · ");
  }
</script>

{#if error}
  <Status {error} />
{:else if collections}
  <div class="flex flex-col gap-y-6 py-20 text-black dark:text-white">
    <h1 class="ml-2 font-serif text-2xl font-light md:ml-6">Photographs</h1>

    {#if collections.length === 0}
      <p class="px-2 text-sm font-light md:px-6">No collections yet.</p>
    {:else}
      <ul class="flex flex-col gap-14 p-2 md:p-6">
        {#each collections as c (c.slug)}
          <li>
            <a href={`/photos/${c.slug}/`} class="group block">
              <div
                class="aspect-[3/2] w-full overflow-hidden rounded"
                style={`background-color: ${c.cover.color}`}
              >
                <img
                  src={imageUrl(c.slug, c.cover, 960)}
                  srcset={srcset(c.slug, c.cover)}
                  sizes="(min-width: 768px) 720px, calc(100vw - 48px)"
                  alt={c.title}
                  width={c.cover.width}
                  height={c.cover.height}
                  loading="lazy"
                  decoding="async"
                  class="h-full w-full object-cover"
                />
              </div>
              <div class="mt-4 flex items-start justify-between gap-4">
                <h2 class="text-md font-medium group-hover:underline">&gt; {c.title}</h2>
                {#if c.date}
                  <time datetime={c.date} class="text-sm text-nowrap">{formatDate(c.date)}</time>
                {/if}
              </div>
              {#if c.description}
                <p class="mt-2 text-sm font-light">{c.description}</p>
              {/if}
              <p class="mt-2 text-sm font-light">{meta(c)}</p>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}
