<script lang="ts">
  import Controller from "./Controller.svelte";
  import Pilot from "./Pilot.svelte";
  import type {
    Pilot as PilotType,
    Controller as ControllerType,
  } from "../../types";
  import { sortBy } from "../../misc";
  export let selected: (PilotType | ControllerType)[];
  let pilots: PilotType[];
  let controllers: ControllerType[];

  $: {
    pilots = [];
    controllers = [];
    selected.forEach(item => {
      if ("facility" in item) {
        controllers.push(item);
      } else {
        pilots.push(item);
      }
    });
    sortBy(pilots, "callsign");
    sortBy(controllers, "callsign");
  }
</script>

<div class="selection-info">
  {#each controllers as item (item.callsign)}
    <Controller ctrl={item} />
  {/each}
  {#each pilots as item (item.callsign)}
    <Pilot pilot={item} />
  {/each}
</div>
