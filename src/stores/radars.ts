import type { Readable } from "svelte/store";
import { derived, readable } from "svelte/store";
import { api } from "../apiconnect";
import type { MapBounds, Radar } from "../types";

export const setBounds = (bounds: MapBounds) => {
  api.setBounds(bounds);
};

export const radars = readable<{ [key: string]: Radar }>({}, (set) => {
  let radars: { [key: string]: Radar } = {};

  const add = (objects: Radar[]) => {
    radars = {
      ...radars,
      ...objects.reduce<{ [key: string]: Radar }>((acc, item: Radar) => {
        acc[item.ctrl.callsign] = item;
        return acc;
      }, {}),
    };
    set(radars);
  };

  const remove = (objects: Radar[]) => {
    objects.forEach((radar) => {
      delete radars[radar.ctrl.callsign];
    });
    set(radars);
  };

  const reset = () => {
    set({});
  };

  api.on("set-radar", add);
  api.on("del-radar", remove);
  api.on("reset", reset);
  return () => {
    api.off("set-radar", add);
    api.off("del-radar", remove);
    api.off("reset", reset);
  };
});

export const radarsGeoJSON = derived<
  Readable<{ [key: string]: Radar }>,
  GeoJSON.FeatureCollection
>(radars, ($radars) => {
  const features: { [key: string]: GeoJSON.Feature } = {};

  Object.values($radars).forEach((radar: Radar) => {
    const { firs } = radar;
    for (const firID in firs) {
      const fir = firs[firID];
      let feature = features[firID];
      if (!feature) {
        feature = {
          type: "Feature",
          geometry: {
            type: "MultiPolygon",
            coordinates: fir.boundaries.points.map((pointset) => [
              pointset.map((point) => [point.lng, point.lat]),
            ]),
          },
          properties: {
            callsigns: [],
          },
        };
        features[firID] = feature;
      }
      feature.properties.callsigns.push(radar.ctrl.callsign);
    }
  });

  const data: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: Object.values(features),
  };

  return data;
});
