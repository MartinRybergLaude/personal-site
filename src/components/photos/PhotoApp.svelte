<script lang="ts">
  import CollectionIndex from "./CollectionIndex.svelte";
  import Collection from "./Collection.svelte";
  import { routeFromPath } from "./api";

  const { slug } = routeFromPath(window.location.pathname);
</script>

{#if slug}
  <Collection {slug} />
{:else}
  <CollectionIndex />
{/if}
