<script lang="ts">
  import { messages } from "../stores/messages";
  import { fade } from "svelte/transition";
</script>

<div class="alert-box">
  {#each $messages as message (message.id)}
    <div transition:fade class={`alert alert-${message.type}`}>
      {message.text}
      <button type="button" class="btn-close" />
    </div>
  {/each}
</div>
