<script lang="ts">
  import type { Airport } from "../types";
  import { createEventDispatcher } from "svelte";
  import MapboxMarker from "./MapboxMarker.svelte";
  export let airport: Airport;

  const dispatch = createEventDispatcher<{ click: Airport }>();
  const onClick = () => {
    dispatch("click", airport);
  };
</script>

<MapboxMarker lat={airport.position.lat} lng={airport.position.lng}>
  <div on:click={onClick} class="arpt-mrk">
    <div class="arpt-mrk-name">{airport.icao}</div>
    {#if airport.controllers.delivery}
      <div class="arpt-mrk-facility arpt-mrk-del" />
    {/if}
    {#if airport.controllers.ground}
      <div class="arpt-mrk-facility arpt-mrk-gnd" />
    {/if}
    {#if airport.controllers.tower}
      <div class="arpt-mrk-facility arpt-mrk-twr" />
    {/if}
    {#if airport.controllers.atis}
      <div class="arpt-mrk-facility arpt-mrk-atis" />
    {/if}
  </div>
</MapboxMarker>

<style>
  .arpt-mrk {
    display: flex;
    background: white;
    font-family: Montserrat;
    font-size: 0.9em;
    font-weight: 600;
    text-transform: uppercase;
    border-radius: 3px;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.7);
    cursor: pointer;
  }

  .arpt-mrk > div {
    padding: 1px 4px 0;
    line-height: 1.4em;
  }

  .arpt-mrk > div:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  .arpt-mrk > div:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  .arpt-mrk-name {
    flex-grow: 1;
  }

  .arpt-mrk-facility {
    display: block;
    text-align: center;
    color: white;
  }

  .arpt-mrk-del {
    background-color: #112266;
  }
  .arpt-mrk-del::before {
    content: "D";
  }

  .arpt-mrk-atis {
    background-color: #be8813;
  }
  .arpt-mrk-atis::before {
    content: "A";
  }

  .arpt-mrk-twr {
    background-color: #9e0707;
  }
  .arpt-mrk-twr::before {
    content: "T";
  }
  .arpt-mrk-gnd {
    background-color: #00480c;
  }
  .arpt-mrk-gnd::before {
    content: "G";
  }
</style>
