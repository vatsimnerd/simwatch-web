import { writable } from "svelte/store";
import { api } from "../apiconnect";

const DEFAULT_TIMEOUT = 8000;

export type Message = {
  id: number;
  text: string;
  type: string;
};

const createMessagesStore = () => {
  const { subscribe, update } = writable([]);

  const setupCounter = () => {
    let seq = 0;
    return () => {
      seq++;
      return seq;
    };
  };

  const counter = setupCounter();

  const addMessage = (
    text: string,
    type: string,
    timeout = DEFAULT_TIMEOUT
  ) => {
    const id = counter();
    const message: Message = {
      id,
      text,
      type,
    };

    update((messages: Message[]) => {
      return [...messages, message];
    });

    setTimeout(() => {
      removeMessage(id);
    }, timeout);
    return id;
  };

  const removeMessage = (id: number) => {
    update((messages: Message[]) => {
      return messages.filter(msg => msg.id !== id);
    });
  };

  return {
    subscribe,
    addMessage,
    removeMessage,
    alert(text: string, timeout?: number) {
      addMessage(text, "danger", timeout);
    },
    error(text: string, timeout?: number) {
      addMessage(`Error: ${text}`, "danger", timeout);
    },
    success(text: string, timeout?: number) {
      addMessage(text, "success", timeout);
    },
    warning(text: string, timeout?: number) {
      addMessage(text, "warning", timeout);
    },
    info(text: string, timeout?: number) {
      addMessage(text, "primary", timeout);
    },
  };
};

export const messages = createMessagesStore();

api.on("error", error => {
  messages.error(error);
});
