<script lang="ts">
  import mapboxgl, { Marker } from "mapbox-gl";
  import { getContext, onDestroy, onMount } from "svelte";
  import { CtxMap, ctxMap } from "../context";

  export let lat: number;
  export let lng: number;
  export let rot = 0;
  export let markerClass: string | null = null;

  const map = getContext<CtxMap>(ctxMap).getMap();
  let container: HTMLElement;
  let marker: Marker;
  let parent: Element | null;
  let popup: Element;
  let popupContent: Element | null = null;
  let mapboxPopup = null;

  $: if (popup) {
    const el = popup.querySelector("*");
    popupContent = el.hasAttribute("data-nopopup") ? null : el;
  }

  $: if (marker) {
    marker.setLngLat([lng, lat]);
  }

  $: if (marker) {
    marker.setRotation(rot);
  }

  $: if (popupContent && marker) {
    if (!mapboxPopup) {
      mapboxPopup = new mapboxgl.Popup();
      mapboxPopup.setDOMContent(popupContent);
      marker.setPopup(mapboxPopup);
    }
  }

  $: if (marker && markerClass) {
    const element = marker.getElement() as HTMLElement;
    const currentClasses = Array.from(element.classList).filter(
      className => !className.startsWith("mapboxgl-")
    );
    const newClasses = markerClass.split(/\s+/);
    const add = newClasses.filter(nc => !currentClasses.includes(nc));
    const remove = currentClasses.filter(cc => !newClasses.includes(cc));
    remove.forEach(className => element.classList.remove(className));
    add.forEach(className => element.classList.add(className));
  }

  onMount(() => {
    // This is a hack to resolve conflicts between svelte and mapbox
    // messing around with the same element (See onDestroy)
    parent = container.parentElement;
    marker = new mapboxgl.Marker(container)
      .setLngLat([lng, lat])
      .setRotation(rot)
      .addTo(map);
  });

  onDestroy(() => {
    if (map && marker) {
      marker.remove();
      // At this point mapboxgl has already detached the marker element
      // Now that svelte is also wishing to detach it right after onDestroy
      // we have to put it back to where it was
      parent.appendChild(container);
      if (popupContent) {
        popup.appendChild(popupContent);
      }
    }
  });
</script>

<div bind:this={container}>
  <slot />
  <div bind:this={popup} class="invisible">
    <slot name="popup">
      <div data-nopopup />
    </slot>
  </div>
</div>

<style>
  .invisible {
    display: none;
  }
</style>
