<script lang="ts">
  import Label from "./Label.svelte";

  let { back }: { back?: { href: string; label: string } } = $props();
</script>

<nav class="flex items-center justify-between px-5 py-5 md:px-8">
  {#if back}
    <a href={back.href} class="group inline-flex items-center gap-2">
      <Label muted class="transition-colors group-hover:text-stone-900 dark:group-hover:text-stone-100">
        &larr; {back.label}
      </Label>
    </a>
  {:else}
    <a href="/" class="group inline-flex items-center gap-2">
      <Label muted class="transition-colors group-hover:text-stone-900 dark:group-hover:text-stone-100">
        &larr; Martin Ryberg Laude
      </Label>
    </a>
  {/if}
  <Label muted>Photographs</Label>
</nav>
