import { derived, Readable, readable, Subscriber } from "svelte/store";
import type { Airport } from "../types";
import { api } from "../apiconnect";
import circle from "@turf/circle";
import { departureArrows, ilsPoly } from "../maplib";

export const airports = readable<Airport[]>(
  [],
  (set: Subscriber<Airport[]>) => {
    let airports = {};

    const add = (objects: Airport[]) => {
      airports = {
        ...airports,
        ...objects.reduce<{ [key: string]: Airport }>((acc, item) => {
          acc[item.meta.icao] = item;
          return acc;
        }, {}),
      };
      set(Object.values(airports));
    };

    const remove = (objects: Airport[]) => {
      objects.forEach((arpt) => {
        delete airports[arpt.meta.icao];
      });
      set(Object.values(airports));
    };

    const reset = () => {
      set([]);
    };

    api.on("set-airport", add);
    api.on("del-airport", remove);
    api.on("reset", reset);
    return () => {
      api.off("set-airport", add);
      api.off("del-airport", remove);
      api.off("reset", reset);
    };
  }
);

export const approachesGeoJSON = derived<
  Readable<Airport[]>,
  GeoJSON.FeatureCollection
>(airports, ($airports) => {
  const data: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  $airports.forEach((airport: Airport) => {
    const approach = airport.ctrls.appr;
    if (approach) {
      const range = approach.visual_range ? approach.visual_range / 2 : 50;
      const feature = circle(
        [airport.meta.position.lng, airport.meta.position.lat],
        range,
        {
          units: "kilometers",
        }
      );
      feature.id = approach.callsign;
      feature.properties = {
        airport_icao: airport.meta.icao,
      };
      data.features.push(feature);
    }
  });
  return data;
});

export const arrivalGeoJSON = derived<
  Readable<Airport[]>,
  GeoJSON.FeatureCollection
>(airports, ($airports) => {
  const data: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  $airports.forEach((airport: Airport) => {
    const { rwys } = airport;
    for (const ident in rwys) {
      const runway = rwys[ident];
      if (runway.active_lnd) {
        const feature: GeoJSON.Feature = ilsPoly(
          [runway.lng, runway.lat],
          runway.hdg
        );
        feature.properties = {
          icao: runway.icao,
          ident,
          heading: (runway.hdg - 90) % 360,
        };
        data.features.push(feature);
      }
    }
  });
  return data;
});

export const departureGeoJSON = derived<
  Readable<Airport[]>,
  GeoJSON.FeatureCollection
>(airports, ($airports) => {
  const data: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  $airports.forEach((airport: Airport) => {
    const { rwys } = airport;
    for (const ident in rwys) {
      const runway = rwys[ident];
      if (runway.active_to) {
        const features: GeoJSON.Feature[] = departureArrows(
          [runway.lng, runway.lat],
          runway.hdg,
          runway.length_ft
        );
        data.features.push(...features);
      }
    }
  });
  return data;
});
