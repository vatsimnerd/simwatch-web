import type { Map } from "mapbox-gl";

export const ctxMap = {};
export const ctxSource = {};

export type CtxMap = {
  getMap: () => Map;
};
