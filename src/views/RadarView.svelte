<script lang="ts">
  import AircraftPopup from "../components/AircraftPopup.svelte";
  import Airport from "../components/Airport.svelte";
  import AlertBox from "../components/AlertBox.svelte";
  import Mapbox from "../components/Mapbox.svelte";
  import MapboxGeojsonSource from "../components/MapboxGeojsonSource.svelte";
  import MapboxLayer from "../components/MapboxLayer.svelte";
  import Sidebar from "../components/Sidebar.svelte";
  import SearchForm from "../components/sidebar/search/SearchForm.svelte";
  import SelectionInfo from "../components/sidebar/SelectionInfo.svelte";
  import RadarToggle from "../components/controls/RadarToggle.svelte";

  import {
    Controller,
    Pilot,
    Airport as TAirport,
    RadarToggleType,
    WeatherInfo,
  } from "../types";
  import {
    approachFillPaint,
    approachStrokePaint,
    planeClusterCount,
    planeClusterPaint,
    firsFillPaint,
    firsStrokePaint,
    arrivalsFillPaint,
    runwaysFilter,
    arrivalsStrokePaint,
    trackPaint,
    departuresFillPaint,
    departuresStrokePaint,
  } from "../maplib";
  import {
    focusedPilot,
    loadTrackedPilot,
    pilots,
    pilotsGeoJSON,
    planeFilter,
    trackGeoJSON,
    unloadTrackedPilot,
  } from "../stores/pilots";
  import {
    airports,
    approachesGeoJSON,
    arrivalGeoJSON,
    departureGeoJSON,
    setWeather,
  } from "../stores/airports";
  import { radars, firsGeoJSON, setBounds } from "../stores/radars";

  // proved to be the center of Europe
  let lat = 51.1657;
  let lng = 8.4515;
  let zoom = 5;

  let showSearch = false;
  let selectionTimeout: number = null;
  let selected: (Controller | Pilot | WeatherInfo)[] = null;
  let showAircraft = true;
  let showControllers = true;
  let showWx = false;
  let hovered: Pilot = null;
  let searchClasses = "btn btn-outline-dark";

  const onPlaneMouseEnter = (e: CustomEvent<GeoJSON.FeatureCollection>) => {
    const plane = $pilots[e.detail.features[0].properties.callsign];
    hovered = plane;
  };

  const onPlaneMouseLeave = () => {
    hovered = null;
  };

  const onPlaneClick = (e: CustomEvent<GeoJSON.FeatureCollection>) => {
    e.detail.features.forEach(feat => {
      const { callsign } = feat.properties;
      if (callsign) {
        const pilot = $pilots[callsign];
        if (pilot) {
          selectItem(pilot);
        }
        loadTrackedPilot(callsign);
      }
    });
  };

  const onCloseSidebar = () => {
    clearSelection();
    showSearch = false;
  };

  const clearSelection = () => {
    selected = null;
    if ($focusedPilot) {
      unloadTrackedPilot();
    }
  };

  const onBounds = (e: CustomEvent) => {
    const { bounds } = e.detail;
    window["bounds"] = bounds;
    setBounds(bounds);
  };

  const onAirportClick = (e: CustomEvent<TAirport>) => {
    Object.values(e.detail.controllers).forEach(ctrl => {
      if (ctrl) selectItem(ctrl);
    });
    if (e.detail.wx) {
      selectItem(e.detail.wx);
    }
  };

  const onFirClick = (e: CustomEvent<GeoJSON.FeatureCollection>) => {
    e.detail.features.forEach(feat => {
      const callsigns = JSON.parse(feat.properties.callsigns);
      callsigns.forEach(callsign => {
        selectItem($radars[callsign]);
      });
    });
  };

  const onApproachClick = (e: CustomEvent<GeoJSON.FeatureCollection>) => {
    e.detail.features.forEach(feat => {
      const icao = feat.properties.airport_icao;
      const airport = $airports.find(arpt => arpt.icao === icao);
      if (airport) {
        selectItem(airport.controllers.approach);
      }
    });
  };

  const selectItem = (object: Controller | Pilot | WeatherInfo) => {
    showSearch = false;
    if (selectionTimeout) {
      const alreadySelected = selected.some(
        item => object.callsign === item.callsign
      );

      if (!alreadySelected) {
        selected = [...selected, object];
      }
    } else {
      selected = [object];
      selectionTimeout = window.setTimeout(() => {
        selectionTimeout = null;
      }, 50);
    }
  };

  const onCtrlToggle = (e: CustomEvent<{ type: RadarToggleType }>) => {
    const { type } = e.detail;
    switch (type) {
      case RadarToggleType.PILOTS:
        showAircraft = !showAircraft;
        break;
      case RadarToggleType.ATC:
        showControllers = !showControllers;
        break;
      case RadarToggleType.WX:
        showWx = !showWx;
        break;
    }
  };

  const onSearchToggle = () => {
    showSearch = !showSearch;
    if (showSearch) {
      if (selected) {
        clearSelection();
      }
    }
  };

  $: {
    searchClasses =
      $planeFilter === null
        ? "btn btn-outline-dark"
        : "btn btn-outline-primary";
  }

  $: {
    setWeather(showWx);
  }
</script>

<div class="radar">
  <Mapbox
    {lat}
    {lng}
    {zoom}
    on:bounds={onBounds}
    images={{
      airplane_jet: "/images/airplane_jet.png",
      airplane_ga: "/images/airplane_ga.png",
    }}
  >
    {#if showControllers}
      {#each $airports as airport (airport.icao)}
        <Airport on:click={onAirportClick} {airport} />
      {/each}
    {/if}

    <MapboxGeojsonSource
      id="planes"
      cluster={true}
      clusterMaxZoom={10}
      clusterRadius={30}
      data={$pilotsGeoJSON}
    >
      {#if showAircraft}
        <MapboxLayer
          id="planes-clustered"
          type="circle"
          filter={["has", "point_count"]}
          paint={planeClusterPaint}
        />
        <MapboxLayer
          id="planes-clustered-count"
          type="symbol"
          filter={["has", "point_count"]}
          layout={planeClusterCount}
          paint={{
            "text-color": "white",
          }}
        />
        <MapboxLayer
          id="planes-unclustered"
          type="symbol"
          filter={["!", ["has", "point_count"]]}
          layout={{
            "icon-image": ["get", "icon"],
            "icon-size": ["get", "size"],
            "icon-rotate": ["get", "rotation"],
            "icon-allow-overlap": true,
          }}
          on:mouseenter={onPlaneMouseEnter}
          on:mouseleave={onPlaneMouseLeave}
          on:click={onPlaneClick}
        />
      {/if}
    </MapboxGeojsonSource>
    <MapboxGeojsonSource id="radars" data={$firsGeoJSON}>
      {#if showControllers}
        <MapboxLayer
          id="radars"
          type="fill"
          paint={firsFillPaint}
          on:click={onFirClick}
        />
        <MapboxLayer id="radars-stroke" type="line" paint={firsStrokePaint} />
      {/if}
    </MapboxGeojsonSource>
    <MapboxGeojsonSource id="approaches" data={$approachesGeoJSON}>
      {#if showControllers}
        <MapboxLayer
          id="approaches"
          type="fill"
          on:click={onApproachClick}
          paint={approachFillPaint}
        />
        <MapboxLayer
          id="approaches-stroke"
          type="line"
          paint={approachStrokePaint}
        />
      {/if}
    </MapboxGeojsonSource>
    <MapboxGeojsonSource id="track" data={$trackGeoJSON}>
      <MapboxLayer id="track" type="line" paint={trackPaint} />
    </MapboxGeojsonSource>
    <MapboxGeojsonSource id="arrivals" data={$arrivalGeoJSON}>
      <MapboxLayer
        id="arrivals"
        type="fill"
        paint={arrivalsFillPaint}
        filter={runwaysFilter}
      />
      <MapboxLayer
        id="arrivals-stroke"
        type="line"
        paint={arrivalsStrokePaint}
        filter={runwaysFilter}
      />
    </MapboxGeojsonSource>
    <MapboxGeojsonSource id="departures" data={$departureGeoJSON}>
      <MapboxLayer
        id="departures"
        type="fill"
        paint={departuresFillPaint}
        filter={runwaysFilter}
      />
      <MapboxLayer
        id="departures-stroke"
        type="line"
        paint={departuresStrokePaint}
        filter={runwaysFilter}
      />
    </MapboxGeojsonSource>
    {#if hovered}
      <AircraftPopup aircraft={hovered} />
    {/if}
  </Mapbox>

  <div class="control-buttons">
    <div>
      <button on:click={onSearchToggle} class={searchClasses}>
        <i class="fas fa-search" />
      </button>
    </div>
    <div>
      <RadarToggle
        on:toggle={onCtrlToggle}
        {showAircraft}
        {showControllers}
        {showWx}
      />
    </div>
  </div>

  {#if selected || showSearch}
    <Sidebar on:close={onCloseSidebar}>
      {#if selected}
        <SelectionInfo {selected} />
      {:else if showSearch}
        <SearchForm />
      {/if}
    </Sidebar>
  {/if}

  <div class="copy">
    <img src="/images/plane_logo.png" alt="logo" /> &copy; 2022 Tango Mike Foxtrot
  </div>
  <AlertBox />
</div>

<style>
  .radar {
    height: 100vh;
    height: calc(var(--vh, 1vh) * 100);
    position: relative;
    overflow: hidden;
  }
</style>
