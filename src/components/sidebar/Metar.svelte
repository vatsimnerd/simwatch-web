<script lang="ts">
  import type { WeatherInfo } from "../../types";
  import { WindSpeed, estimateWindSpeed } from "../../weather";

  export let metar: WeatherInfo;
  let sidewindSpeed: WindSpeed;

  $: {
    sidewindSpeed = estimateWindSpeed(metar.side_wind_lnd, metar.side_wind_to);
  }
</script>

<div
  class="weather-info"
  class:calm={sidewindSpeed === WindSpeed.CALM}
  class:light={sidewindSpeed === WindSpeed.LIGHT}
  class:strong={sidewindSpeed === WindSpeed.STRONG}
  class:severe={sidewindSpeed === WindSpeed.SEVERE}
>
  <h3 class="title">{metar.callsign}</h3>
  <div class="atis-text">
    {metar.raw}<br />
  </div>
  <table class="metar-table">
    <tr>
      <td>Wind Direction</td>
      <td>{metar.wind_direction}</td>
    </tr>
    <tr>
      <td>Wind Speed</td>
      <td>{metar.wind_speed}</td>
    </tr>
    {#if metar.wind_gust}
      <tr>
        <td>Gusting</td>
        <td>{metar.wind_gust}</td>
      </tr>
    {/if}
    <tr>
      <td>Landing sidewind</td>
      <td>{metar.side_wind_lnd}</td>
    </tr>
    <tr>
      <td>Takeoff sidewind</td>
      <td>{metar.side_wind_to}</td>
    </tr>
  </table>
</div>
