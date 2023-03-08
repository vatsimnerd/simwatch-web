import type { MapBoundsEx } from "./types";

export type Handler = (...args: any[]) => void;
export type HandlerFilter = (...args: any[]) => boolean;
export type HandlerFinaliser = () => void;
export type DebouncedHandlerOptions = {
  debounce?: number;
  filters?: HandlerFilter[];
  finaliser?: HandlerFinaliser;
};

// decorator function debouncing an event handler
// instead of calling the actual event handler being wrapped
// it sets a timeout and collects all the handler calls until
// the timeout has gone off, applying filters if there's any
// and then runs the handler as many times as the number of calls
// have occured and then optionally runs a finaliser
export const DebouncedHandler = (
  handler: Handler,
  options: DebouncedHandlerOptions = { debounce: 50 }
) => {
  let argsQueue: any[][] = [];
  let tm: number = -1;
  const { debounce = 50, filters = [], finaliser = undefined } = options;

  return (...args: any[]) => {
    for (let i = 0; i < filters.length; i++) {
      if (!filters[i](...args)) {
        return;
      }
    }

    if (tm < 0) {
      tm = window.setTimeout(() => {
        argsQueue.forEach(args => {
          handler.apply(null, args);
        });
        argsQueue = [];
        clearTimeout(tm);
        tm = -1;

        if (finaliser) {
          finaliser();
        }
      }, debounce);
    }
    argsQueue.push(args);
  };
};

export const formatDuration = (secs: number) => {
  let hrs = Math.floor(secs / 3600);
  secs = secs % 3600;
  let mins = Math.floor(secs / 60);
  secs = secs % 60;

  let hrsStr = `${hrs}`;
  if (hrsStr.length === 1) hrsStr = "0" + hrsStr;

  let minsStr = `${mins}`;
  if (minsStr.length === 1) minsStr = "0" + minsStr;

  let secsStr = `${secs}`;
  if (secsStr.length === 1) secsStr = "0" + secsStr;

  return `${hrsStr}:${minsStr}`;
};

export function mbEq(one: MapBoundsEx, another: MapBoundsEx): boolean {
  return (
    one.min.lat === another.min.lat &&
    one.min.lng === another.min.lng &&
    one.max.lat === another.max.lat &&
    one.max.lng === another.max.lng &&
    one.zoom === another.zoom
  );
}

export function sortBy<T>(slice: T[], key: keyof T) {
  slice.sort((a, b) => {
    if (a[key] > b[key]) {
      return 1;
    }
    if (a[key] < b[key]) {
      return -1;
    }
    return 0;
  });
}
