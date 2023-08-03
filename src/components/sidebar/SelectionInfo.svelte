<script lang="ts">
  import Controller from "./Controller.svelte";
  import Pilot from "./Pilot.svelte";
  import type {
    Pilot as PilotType,
    Controller as ControllerType,
    WeatherInfo,
  } from "../../types";
  import { sortBy } from "../../misc";
  import Metar from "./Metar.svelte";
  export let selected: (PilotType | ControllerType | WeatherInfo)[];
  let pilots: PilotType[];
  let controllers: ControllerType[];
  let metars: WeatherInfo[];

  $: {
    pilots = [];
    controllers = [];
    metars = [];
    selected.forEach(item => {
      if ("facility" in item) {
        controllers.push(item);
      } else if ("position" in item) {
        pilots.push(item);
      } else {
        metars.push(item);
      }
    });
    sortBy(pilots, "callsign");
    sortBy(controllers, "callsign");
    sortBy(metars, "callsign");
  }
</script>

<div class="selection-info">
  {#each metars as item (item.callsign)}
    <Metar metar={item} />
  {/each}
  {#each controllers as item (item.callsign)}
    <Controller ctrl={item} />
  {/each}
  {#each pilots as item (item.callsign)}
    <Pilot pilot={item} />
  {/each}
</div>
