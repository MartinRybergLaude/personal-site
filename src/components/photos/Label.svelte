<script lang="ts">
  import type { Snippet } from "svelte";

  /**
   * The one text style used across /photos: small uppercase Satoshi, always
   * black or white. Hierarchy comes from weight alone.
   */
  let {
    weight = "regular",
    class: className = "",
    children,
  }: {
    weight?: "light" | "regular" | "bold";
    class?: string;
    children: Snippet;
  } = $props();

  const weights = { light: "font-light", regular: "font-medium", bold: "font-bold" };
</script>

<span class="text-[11px] uppercase tracking-[0.18em] {weights[weight]} {className}">
  {@render children()}
</span>
