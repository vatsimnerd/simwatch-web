<script lang="ts">
  import { messages } from "../stores/messages";
  import { fade } from "svelte/transition";

  const removeMessage = (id: number) => {
    messages.removeMessage(id);
  };
</script>

<div class="alert-box">
  {#each $messages as message (message.id)}
    <div transition:fade class={`alert alert-${message.type}`}>
      {message.text}
      <button
        type="button"
        class="close"
        on:click={() => removeMessage(message.id)}
      />
    </div>
  {/each}
</div>
