<script>
  import { createEventDispatcher } from "svelte";
  import { RadarToggleType } from "../../types";

  export let showAircraft = true;
  export let showControllers = true;

  const dispatch = createEventDispatcher();

  const onClick = (cType) => {
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
</div>
