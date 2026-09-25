<script lang="ts">
  import { fetchJson, formatDate, imageUrl, srcset } from "./api";
  import type { CollectionsIndex, CollectionSummary } from "./types";
  import Container from "./Container.svelte";
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
  <Container>
    <header class="pt-20 pb-16 md:pt-32 md:pb-24">
      <Label weight="light">Collections</Label>
      <h1 class="mt-3"><Label weight="bold">Martin Ryberg Laude</Label></h1>
    </header>

    {#if collections.length === 0}
      <div class="pb-24"><Label weight="light">No collections yet</Label></div>
    {:else}
      <ul class="flex flex-col gap-20 pb-32 md:gap-28">
        {#each collections as c (c.slug)}
          <li>
            <a href={`/photos/${c.slug}/`} class="group block">
              <div
                class="aspect-[3/2] w-full overflow-hidden"
                style={`background-color: ${c.cover.color}`}
              >
                <img
                  src={imageUrl(c.slug, c.cover, 1600)}
                  srcset={srcset(c.slug, c.cover)}
                  sizes="(min-width: 1216px) 1088px, calc(100vw - 40px)"
                  alt={c.title}
                  width={c.cover.width}
                  height={c.cover.height}
                  loading="lazy"
                  decoding="async"
                  class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
              </div>
              <div class="mt-5 flex flex-col gap-2">
                <Label weight="bold" class="underline-offset-4 group-hover:underline">{c.title}</Label>
                <Label weight="light">{meta(c)}</Label>
              </div>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </Container>
{/if}
