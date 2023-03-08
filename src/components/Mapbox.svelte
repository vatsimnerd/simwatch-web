<script lang="ts">
  import mapboxgl from "mapbox-gl";
  import "mapbox-gl/dist/mapbox-gl.css";

  import {
    createEventDispatcher,
    onDestroy,
    onMount,
    setContext,
  } from "svelte";
  import { ctxMap } from "../context";
  import {
    __MAPBOX_ACCESS_TOKEN__,
    __MAPTILER_KEY__,
    __MAPTILER_STYLE__,
  } from "../secrets";
  import type { MapBoundsEx } from "../types";

  const maptilerStyleURL = `${__MAPTILER_STYLE__}?key=${__MAPTILER_KEY__}`;

  const dispatch = createEventDispatcher();

  export let lat: number;
  export let lng: number;
  export let zoom: number;
  export let images: { [key: string]: string } = {};
  export let map = null;

  type Coords = { center?: [number, number]; zoom?: number };

  let coords: Coords = {
    center: [lng, lat],
    zoom,
  };

  let proxy: Coords = {};
  let tm = null;

  $: setZoom(zoom);
  $: setCenter(lng, lat);

  const setZoom = zoom => {
    proxy = {
      ...proxy,
      zoom,
    };
    if (!tm) {
      tm = setTimeout(syncCoords, 50);
    }
  };

  const setCenter = (lng: number, lat: number) => {
    proxy = {
      ...proxy,
      center: [lng, lat],
    };
    if (!tm) {
      tm = setTimeout(syncCoords, 50);
    }
  };

  // asyncronous sync to avoid setting center when only zoom
  // was modified and vice versa.
  // damned two-way sync.
  const syncCoords = () => {
    coords = proxy;
    proxy = {};
    tm = null;
  };

  setContext(ctxMap, {
    getMap: () => map,
  });

  let container;
  let loaded = false;

  const onBounds = () => {
    if (!map) return;
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const bounds_ex: MapBoundsEx = {
      min: {
        lat: bounds._sw.lat,
        lng: bounds._sw.lng,
      },
      max: {
        lat: bounds._ne.lat,
        lng: bounds._ne.lng,
      },
      zoom,
    };
    dispatch("bounds", { bounds: bounds_ex });
  };

  const onZoomEnd = () => {
    setZoom(map.getZoom());
  };

  const onBoundsStart = () => {
    dispatch("boundsstart");
  };

  const setupEventListeners = () => {
    window.addEventListener("resize", onBoundsStart);
    map.on("zoomstart", onBoundsStart);
    map.on("movestart", onBoundsStart);
    map.on("zoomend", onBounds);
    map.on("zoomend", onZoomEnd);
    map.on("moveend", onBounds);
    map.on("resize", onBounds);
  };

  const removeEventListeners = () => {
    window.removeEventListener("resize", onBoundsStart);
    map.off("zoomstart", onBoundsStart);
    map.off("movestart", onBoundsStart);
    map.off("zoomend", onBounds);
    map.off("zoomend", onZoomEnd);
    map.off("moveend", onBounds);
    map.off("resize", onBounds);
  };

  const loadImages = async () => {
    const promises = [];
    for (const name in images) {
      promises.push(
        new Promise((resolve, reject) => {
          map.loadImage(images[name], (error, image) => {
            if (error) {
              reject(error);
            } else {
              resolve({ name, image });
            }
          });
        })
      );
    }
    Promise.all(promises).then(values => {
      values.forEach(value => {
        map.addImage(value.name, value.image);
      });
    });
  };

  $: if (map) {
    map.flyTo(coords);
  }

  onMount(() => {
    map = new mapboxgl.Map({
      accessToken: __MAPBOX_ACCESS_TOKEN__,
      container,
      style: maptilerStyleURL,
      ...coords,
    });

    map.on("load", async () => {
      await loadImages();
      loaded = true;
      dispatch("ready");
      onBounds();
    });

    setupEventListeners();
  });

  onDestroy(() => {
    removeEventListeners();
    map.remove();
    map = null;
  });
</script>

<div class="map" bind:this={container}>
  {#if loaded}
    <slot />
  {/if}
</div>

<style>
  .map {
    width: 100vw;
    height: 100vh;
  }
</style>
