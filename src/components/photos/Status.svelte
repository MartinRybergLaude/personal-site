<script lang="ts">
  import { ApiError } from "./api";

  let { error }: { error: unknown } = $props();

  const message = $derived.by(() => {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) return "Sign in required.";
      if (error.status === 404) return "Not found.";
      return `Error ${error.status}.`;
    }
    return "Something went wrong.";
  });
</script>

<p class="px-2 py-20 text-sm font-light text-black md:px-6 dark:text-white">{message}</p>
