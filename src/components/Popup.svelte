<script lang="ts">
  export let left: number;
  export let top: number;
  export let width = 100;
  export let height = 50;

  let positionStyle = "";

  $: positionStyle = `left: ${left - width / 2}px; top: ${
    top - height
  }px; width: ${width}px; height: ${height}px`;
</script>

<div style={positionStyle} class="popup">
  <div class="popup-inner">
    <slot />
  </div>
</div>

<style>
  .popup {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    box-sizing: border-box;
  }

  .popup-inner {
    overflow: hidden;
  }

  .popup::after {
    content: " ";
    position: absolute;
    bottom: -20px;
    width: 0;
    height: 0;
    left: calc(50% - 10px);
    border-width: 10px;
    border-style: solid;
    border-color: transparent;
    border-top-color: rgba(0, 0, 0, 0.7);
  }
</style>
