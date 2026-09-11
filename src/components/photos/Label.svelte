<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    muted = false,
    class: className = "",
    children,
  }: { muted?: boolean; class?: string; children: Snippet } = $props();
</script>

<span
  class="text-[11px] font-medium uppercase tracking-[0.18em] {muted
    ? 'text-stone-500 dark:text-stone-400'
    : 'text-stone-900 dark:text-stone-100'} {className}"
>
  {@render children()}
</span>
