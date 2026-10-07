<script lang="ts">
  import type { Snippet } from "svelte";

  /** The site's raised teal button, as used for "All articles →". */
  let { href, children }: { href: string; children: Snippet } = $props();
</script>

<div
  class="relative h-10 w-fit rounded border border-black bg-[url('/src/assets/images/texture.png')] bg-cover"
>
  <a
    {href}
    class="inline-flex h-full -translate-x-[2px] -translate-y-[2px] items-center gap-2 rounded border border-black bg-[#62cfbf] px-5 text-sm font-medium whitespace-nowrap text-black transition hover:translate-x-0 hover:translate-y-0 hover:border-transparent active:translate-x-px active:translate-y-px"
  >
    {@render children()}
  </a>
</div>
