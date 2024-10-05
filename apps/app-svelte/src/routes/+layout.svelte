<script>
  import "../app.css";

  import { queryClient } from "$lib/queryClient";
  import { QueryClientProvider } from '@tanstack/svelte-query';

</script>

<QueryClientProvider client={queryClient}>
  <slot />
</QueryClientProvider>
