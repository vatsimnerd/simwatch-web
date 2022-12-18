<script lang="ts">
  import Popup from "./Popup.svelte";
  import { CtxMap, ctxMap } from "../context";
  import { getContext } from "svelte";
  import type { Pilot } from "../types";

  export let aircraft: Pilot;

  let callsign = aircraft.callsign;
  let acType = aircraft.flight_plan?.aircraft || null;
  let departure = aircraft.flight_plan?.departure;
  let arrival = aircraft.flight_plan?.arrival;
  let name = aircraft.name;

  const map = getContext<CtxMap>(ctxMap).getMap();

  const coords = map.project([aircraft.position.lng, aircraft.position.lat]);
  let left = coords.x;
  let top = coords.y - 25;
</script>

<Popup {left} {top} width={240} height={80}>
  <h3>
    {callsign}
    {#if departure && arrival}
      <sub>{departure} - {arrival}</sub>
    {/if}
  </h3>
  <div class="additional">
    {#if acType}
      <div>{acType}</div>
    {/if}
    {#if name}
      <div>{name}</div>
    {/if}
  </div>
</Popup>

<style>
  h3 {
    font-size: 1.2em;
    font-weight: bold;
    margin: 0 0 8px;
    padding: 4px 0;
    border-bottom: 1px solid #ccc;
  }

  h3 sub {
    font-weight: normal;
    font-size: 0.7em;
    top: -4px;
    position: relative;
  }

  .additional {
    font-family: "Montserrat";
    line-height: 1.3em;
  }

  .additional > div {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
