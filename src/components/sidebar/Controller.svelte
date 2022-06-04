<script lang="ts">
  import { onMount } from "svelte";
  import { formatDuration } from "../../misc";
  import type { Controller } from "../../types";

  export let ctrl: Controller;
  let facility = "";
  let facilityClass = "";
  let atis: string[] | null;
  let online = "";
  let longSession = false;

  $: {
    switch (ctrl.facility) {
      case 1:
        facility = "ATIS";
        break;
      case 2:
        facility = "Delivery";
        break;
      case 3:
        facility = "Ground";
        break;
      case 4:
        facility = "Tower";
        break;
      case 5:
        facility = "Approach";
        break;
      case 6:
        facility = "Radar";
        break;
      default:
        break;
    }

    atis =
      facility === "ATIS" && ctrl.text_atis ? ctrl.text_atis.split("\n") : null;
    facilityClass = facility.toLowerCase();
  }

  const setOnline = () => {
    const start = new Date(ctrl.logon_time);
    const now = new Date();
    const onlineSec = Math.round((now.getTime() - start.getTime()) / 1000);
    longSession = onlineSec > 60 * 60 * 2; // more than 2 hours
    online = formatDuration(onlineSec);
  };

  onMount(() => {
    setOnline();
    const int = setInterval(() => {
      setOnline();
    }, 1000);
    return () => {
      clearInterval(int);
    };
  });
</script>

<div class="controller {facilityClass}">
  <h3 class="title">{ctrl.human_readable} <sub>{ctrl.name}</sub></h3>
  <h4 class="radio">
    <div class="callsign">{ctrl.callsign}</div>
    <div class="freq">{ctrl.frequency.toFixed(3)}</div>
  </h4>
  {#if atis}
    <div class="atis-text">
      {#each atis as line}
        {line}<br />
      {/each}
    </div>
  {/if}
  <div class="online" class:long-session={longSession}>{online}</div>
</div>
