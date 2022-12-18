<script lang="ts">
  import type { AnyLayer } from "mapbox-gl";
  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { CtxMap, ctxMap, CtxSource, ctxSource } from "../context";
  const map = getContext<CtxMap>(ctxMap).getMap();
  const dispatch = createEventDispatcher();

  export let id: string;
  export let type: string;
  export let paint = null;
  export let filter = null;
  export let layout = null;
  export let minzoom = null;

  let registered = false;

  $: if (registered) {
    for (const key in paint) {
      map.setPaintProperty(id, key, paint[key]);
    }
  }

  const ctx = getContext<CtxSource>(ctxSource);
  const sourceID = ctx.getSourceID();

  const onClick = e => {
    dispatch("click", e);
  };

  const onMouseEnter = e => {
    dispatch("mouseenter", e);
  };

  const onMouseLeave = e => {
    dispatch("mouseleave", e);
  };

  onMount(() => {
    const opts: Record<string, any> = {
      id,
      source: sourceID,
      type,
    };

    if (paint) {
      opts.paint = paint;
    }
    if (filter) {
      opts.filter = filter;
    }
    if (layout) {
      opts.layout = layout;
    }
    if (minzoom) {
      opts.minzoom = minzoom;
    }

    map.addLayer(opts as AnyLayer);
    ctx.registerLayer(id);
    registered = true;

    map.on("click", id, onClick);
    map.on("mouseenter", id, onMouseEnter);
    map.on("mouseleave", id, onMouseLeave);

    return () => {
      ctx.unregisterLayer(id);
      registered = false;
      map.removeLayer(id);
      map.off("click", id, onClick);
      map.off("mouseenter", id, onMouseEnter);
      map.off("mouseleave", id, onMouseLeave);
    };
  });
</script>
