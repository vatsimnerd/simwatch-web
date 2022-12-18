<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fly } from "svelte/transition";

  const dispatch = createEventDispatcher();

  const onClick = () => {
    dispatch("close");
  };
</script>

<aside transition:fly={{ x: 400, duration: 250 }} class="sidebar">
  <div class="sidebar-inner">
    <slot />
  </div>
  <div on:click={onClick} class="sidebar-close">&times;</div>
</aside>
