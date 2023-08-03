<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { RadarToggleType } from "../../types";

  export let showAircraft = true;
  export let showControllers = true;
  export let showWx = false;

  const dispatch = createEventDispatcher();

  const onClick = (cType: RadarToggleType) => {
    dispatch("toggle", { type: cType });
  };
</script>

<div class="btn-group-vertical">
  <button
    on:click={() => onClick(RadarToggleType.PILOTS)}
    class="btn btn-outline-dark"
    class:active={showAircraft}
  >
    <i class="fas fa-plane" />
  </button>
  <button
    on:click={() => onClick(RadarToggleType.ATC)}
    class="btn btn-outline-dark"
    class:active={showControllers}
  >
    <i class="fas fa-broadcast-tower" />
  </button>

  <button
    on:click={() => onClick(RadarToggleType.WX)}
    class="btn btn-outline-dark"
    class:active={showWx}
  >
    <i class="far fa-sun" />
  </button>
</div>
