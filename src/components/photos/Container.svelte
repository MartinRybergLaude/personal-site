<script lang="ts">
  import type { Snippet } from "svelte";

  /** The narrow column everything except the masonry grid lives in. */
  let { class: className = "", children }: { class?: string; children: Snippet } = $props();
</script>

<div class="mx-auto w-full max-w-6xl px-5 md:px-8 {className}">
  {@render children()}
</div>
