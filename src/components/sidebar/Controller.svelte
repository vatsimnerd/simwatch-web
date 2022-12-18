<script lang="ts">
  import { onMount } from "svelte";
  import { formatDuration } from "../../misc";
  import type { Controller } from "../../types";

  export let ctrl: Controller;
  let frequency = "";
  let facilityClass = "";
  let atis: string[] | null;
  let online = "";
  let longSession = false;

  $: {
    atis =
      ctrl.facility === "ATIS" && ctrl.text_atis
        ? ctrl.text_atis.split("\n")
        : null;
    facilityClass = ctrl.facility.toLowerCase();
    frequency = (ctrl.freq / 1000).toFixed(3);
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
    <div class="freq">{frequency}</div>
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
