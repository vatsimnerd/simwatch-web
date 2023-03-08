import type { Readable } from "svelte/store";
import { derived, readable } from "svelte/store";
import { api } from "../apiconnect";
import type { FIR, MapBoundsEx, Controller } from "../types";

export const setBounds = (bounds: MapBoundsEx) => {
  api.setBounds(bounds);
};

export const firs = readable<{ [key: string]: FIR }>({}, set => {
  let firs: { [key: string]: FIR } = {};

  const add = (objects: FIR[]) => {
    firs = {
      ...firs,
      ...objects.reduce<{ [key: string]: FIR }>((acc, item: FIR) => {
        Object.values(item.controllers).forEach(ctrl => {
          acc[ctrl.callsign] = item;
        });
        return acc;
      }, {}),
    };
    set(firs);
  };

  const remove = (objects: FIR[]) => {
    objects.forEach(fir => {
      Object.values(fir.controllers).forEach(ctrl => {
        delete firs[ctrl.callsign];
      });
    });
    set(firs);
  };

  api.on("set-firs", add);
  api.on("del-firs", remove);
  return () => {
    api.off("set-firs", add);
    api.off("del-firs", remove);
  };
});

export const radars = derived<
  Readable<Record<string, FIR>>,
  Record<string, Controller>
>(firs, $firs => {
  let radars = {};
  Object.values($firs).forEach(fir => {
    radars = {
      ...radars,
      ...fir.controllers,
    };
  });
  return radars;
});

export const firsGeoJSON = derived<
  Readable<{ [key: string]: FIR }>,
  GeoJSON.FeatureCollection
>(firs, $firs => {
  const features: { [key: string]: GeoJSON.Feature } = {};

  Object.values($firs).forEach((fir: FIR) => {
    let feature = features[fir.icao];
    if (!feature) {
      feature = {
        type: "Feature",
        geometry: {
          type: "MultiPolygon",
          coordinates: fir.boundaries.points.map(pointset => [
            pointset.map(point => [point.lng, point.lat]),
          ]),
        },
        properties: {
          callsigns: [],
        },
      };
      features[fir.icao] = feature;
    }
    Object.keys(fir.controllers).forEach(callsign => {
      feature.properties.callsigns.push(callsign);
    });
  });

  const data: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: Object.values(features),
  };

  return data;
});
