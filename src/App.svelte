<script lang="ts">
  import RadarView from "./views/RadarView.svelte";
  import Router from "svelte-spa-router";

  const routes = {
    "/": RadarView,
  };
</script>

<Router {routes} />

<style>
</style>
