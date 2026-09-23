<script lang="ts">
  import Label from "./Label.svelte";
  import { ApiError } from "./api";

  let { error }: { error: unknown } = $props();

  const message = $derived.by(() => {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) return "Sign in required";
      if (error.status === 404) return "Not found";
      return `Error ${error.status}`;
    }
    return "Something went wrong";
  });
</script>

<div class="flex min-h-[60vh] items-center justify-center">
  <Label weight="light">{message}</Label>
</div>
