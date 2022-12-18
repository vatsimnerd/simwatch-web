<script lang="ts">
  import type { FlightPlan, Pilot } from "../../types";

  export let pilot: Pilot;

  let name = "";
  let ifr: boolean;
  let vfr: boolean;
  let route = "";
  let fp: FlightPlan | null;

  $: {
    const tokens = pilot.name.split(/\s+/);
    if (tokens.length) {
      const last = tokens.splice(tokens.length - 1, 1)[0];
      if (/[A-Z]{4}/.test(last)) {
        name = tokens.join(" ");
      } else {
        name = pilot.name;
      }
    }
  }

  $: {
    if (pilot.flight_plan) {
      fp = pilot.flight_plan;
      ifr = fp.flight_rules === "I";
      vfr = fp.flight_rules === "V";
      const { departure, arrival } = fp;
      if (departure && arrival) {
        route = `${departure} - ${arrival}`;
      }
    }
  }
</script>

<div class="pilot">
  <h3 class="title" class:ifr class:vfr>{pilot.callsign} <sub>{name}</sub></h3>
  <hr />
  <h4 class="route">{route}</h4>
  <table class="pilot-table">
    <tr><td>Altitude</td><td>{pilot.altitude}</td></tr>
    <tr><td>Heading</td><td>{pilot.heading}</td></tr>
    <tr><td>Groundspeed</td><td>{pilot.groundspeed}</td></tr>
    <tr><td colspan="2"><hr /></td></tr>
    <tr><td>Lat</td><td>{pilot.position.lat}</td></tr>
    <tr><td>Lng</td><td>{pilot.position.lng}</td></tr>
    <tr><td>QNH</td><td>{pilot.qnh_mb}</td></tr>
    <tr><td>Transponder</td><td>{pilot.transponder}</td></tr>
    {#if fp}
      <tr class="flightplan"><th colspan="2">FLIGHTPLAN</th></tr>
      <tr><td>Aircraft Type</td><td>{fp.aircraft}</td></tr>
      <tr><td>Altitude</td><td>{fp.altitude}</td></tr>
      <tr><td>Cruise TAS</td><td>{fp.cruise_tas}</td></tr>
      <tr><td>Departure Time</td><td>{fp.deptime}</td></tr>
      <tr><td>Enroute Time</td><td>{fp.enroute_time}</td></tr>
      <tr><td>Fuel Time</td><td>{fp.fuel_time}</td></tr>
      <tr><th colspan="2">ROUTE</th></tr>
      <tr
        ><td colspan="2" class="pre">
          {fp.route}
        </td></tr
      >
      <tr><th colspan="2">REMARKS</th></tr>
      <tr
        ><td colspan="2" class="pre">
          {fp.remarks}
        </td></tr
      >
    {/if}
  </table>
</div>

<style>
  tr.flightplan th {
    padding: 20px 0 4px;
    /* border-top: 1px solid #ccc; */
    border-bottom: 1px solid #ccc;
  }
</style>
