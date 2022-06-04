<script lang="ts">
  import type { GeoJSONSource, GeoJSONSourceRaw } from "mapbox-gl";
  import type mapboxgl from "mapbox-gl";

  import { getContext, onMount, setContext } from "svelte";
  import { ctxMap, ctxSource } from "../context";
  const map = getContext<{ getMap: () => mapboxgl.Map }>(ctxMap).getMap();

  export let id: string;
  export let data: GeoJSON.FeatureCollection;
  export let lineMetrics = false;
  export let cluster = false;
  export let clusterMaxZoom = 14;
  export let clusterRadius = 30;

  let layerIDs: string[] = [];
  let enableLayers = false;

  setContext(ctxSource, {
    getSourceID: () => id,
    registerLayer: (layerID: string) => {
      layerIDs = [...layerIDs, layerID];
    },
    unregisterLayer: (layerID: string) => {
      layerIDs = layerIDs.filter((item) => item !== layerID);
    },
  });

  $: {
    const src = map.getSource(id) as GeoJSONSource;
    if (src) {
      src.setData(data);
    }
  }

  onMount(() => {
    const sourceOpts: GeoJSONSourceRaw = {
      type: "geojson",
      lineMetrics,
      data,
      cluster,
      clusterRadius,
      clusterMaxZoom,
    };
    map.addSource(id, sourceOpts);
    enableLayers = true;

    return () => {
      if (map) {
        layerIDs.forEach((layerID) => {
          try {
            map.removeLayer(layerID);
          } catch (e) {}
        });
        try {
          map.removeSource(id);
        } catch (e) {}
      }
    };
  });
</script>

{#if enableLayers}
  <slot />
{/if}
