import type { Map } from "mapbox-gl";

export const ctxMap = {};
export const ctxSource = {};

export type CtxMap = {
  getMap: () => Map;
};

export type CtxSource = {
  getSourceID: () => string;
  registerLayer: (id: string) => void;
  unregisterLayer: (id: string) => void;
};
