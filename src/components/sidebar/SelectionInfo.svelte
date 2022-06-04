<script>
  import Controller from "./Controller.svelte";
  import Pilot from "./Pilot.svelte";
  export let selected;
  let items;

  $: {
    items = [...selected];
    items.sort((a, b) => {
      if (a.type === "aircraft" && b.type !== "aircraft") {
        return -1;
      } else if (a.type !== "aircraft" && b.type === "aircraft") {
        return 1;
      } else {
        return 0;
      }
    });
  }
</script>

<div class="selection-info">
  {#each items as item (item.callsign)}
    {#if item.facility}
      <Controller ctrl={item} />
    {:else}
      <Pilot pilot={item} />
    {/if}
  {/each}
</div>
