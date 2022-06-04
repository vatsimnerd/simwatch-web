<script lang="ts">
  import { onMount } from "svelte";
  import { planeFilter, setupFilter } from "../../../stores/pilots";

  let input = null;
  let value = "";
  let loading = false;

  const onSubmit = () => {
    if (loading) return;
    loading = true;
    setupFilter(value).finally(() => {
      loading = false;
    });
  };

  const onReset = () => {
    loading = true;
    setupFilter("").finally(() => {
      loading = false;
    });
  };

  onMount(() => {
    value = $planeFilter || "";
    // to make sure the animation has ended
    // weird effects may appear otherwise
    setTimeout(() => {
      input.focus();
    }, 270);
  });
</script>

<div class="search-form">
  {#if $planeFilter}
    <div class="mb-3">
      <b class="form-label">CURRENT FILTER</b>
      <div class="filter">
        {$planeFilter}
        <div class="reset">
          <button on:click={onReset} class="btn btn-sm btn-danger">
            CLEAR
          </button>
        </div>
      </div>
    </div>
  {/if}
  <form on:submit|preventDefault={onSubmit} class="form">
    <div class="form-group">
      <label for="search" class="form-label">Filter</label>
      <input
        id="search"
        autocomplete="off"
        bind:this={input}
        bind:value
        class="form-control"
        type="text"
      />
    </div>
    <div class="form-group text-end">
      <button type="submit" class:disabled={loading} class="btn btn-primary">
        Apply
      </button>
    </div>
  </form>

  <p class="mt-3">
    A complete documentation is on its way. Meanwhile feel free to play with
    filters, try something like <code>
      aircraft =~ "^B738" AND callsign =~ "^DLH" AND alt > 2000
    </code> to find all the Lufthansa Boeings 737-800 over 2000ft.
  </p>
  <p>
    Keep in mind that quotes are mandatory for string values, there are "OR" and
    "AND" operators to combine conditions and braces are also correctly parsed
    and applied.
  </p>
  <p>A complete field list is following:</p>
  <ul>
    <li>aircraft</li>
    <li>name</li>
    <li>callsign</li>
    <li>departure</li>
    <li>arrival</li>
    <li>alt</li>
    <li>lat</li>
    <li>lng</li>
    <li>gs</li>
    <li>rules</li>
  </ul>
</div>
