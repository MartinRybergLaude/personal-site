<script lang="ts">
  import Container from "./Container.svelte";
  import Label from "./Label.svelte";

  let { back }: { back?: { href: string; label: string } } = $props();
  const link = back ?? { href: "/", label: "Martin Ryberg Laude" };
</script>

<Container>
  <nav class="flex items-center justify-between py-6">
    <a href={link.href} class="underline-offset-4 hover:underline">
      <Label weight="light">&larr; {link.label}</Label>
    </a>
    <Label weight="light">Photographs</Label>
  </nav>
</Container>
