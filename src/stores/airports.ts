import circle from "@turf/circle";
import { derived, Readable, readable, Subscriber } from "svelte/store";
import { api } from "../apiconnect";
import { departureArrows, ilsPoly } from "../maplib";
import type { Airport } from "../types";
import { processWeather } from "../weather";

export const setWeather = (value: boolean) => {
  api.setWeather(value);
};

export const airports = readable<Airport[]>(
  [],
  (set: Subscriber<Airport[]>) => {
    let airports = {};

    const add = (objects: Airport[]) => {
      objects = objects.map(obj => processWeather(obj));
      airports = {
        ...airports,
        ...objects.reduce<{ [key: string]: Airport }>((acc, item) => {
          acc[item.icao] = item;
          return acc;
        }, {}),
      };
      set(Object.values(airports));
    };

    const remove = (objects: Airport[]) => {
      objects.forEach(arpt => {
        delete airports[arpt.icao];
      });
      set(Object.values(airports));
    };

    api.on("set-airports", add);
    api.on("del-airports", remove);
    return () => {
      api.off("set-airports", add);
      api.off("del-airports", remove);
    };
  }
);

export const approachesGeoJSON = derived<
  Readable<Airport[]>,
  GeoJSON.FeatureCollection
>(airports, $airports => {
  const data: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  $airports.forEach((airport: Airport) => {
    const approach = airport.controllers.approach;
    if (approach) {
      const range = approach.visual_range ? approach.visual_range / 2 : 50;
      const feature = circle(
        [airport.position.lng, airport.position.lat],
        range,
        {
          units: "kilometers",
        }
      );
      feature.id = approach.callsign;
      feature.properties = {
        airport_icao: airport.icao,
      };
      data.features.push(feature);
    }
  });
  return data;
});

export const arrivalGeoJSON = derived<
  Readable<Airport[]>,
  GeoJSON.FeatureCollection
>(airports, $airports => {
  const data: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  $airports.forEach((airport: Airport) => {
    const { runways } = airport;
    for (const ident in runways) {
      const runway = runways[ident];
      if (runway.active_lnd) {
        const feature: GeoJSON.Feature = ilsPoly(
          [runway.longitude, runway.latitude],
          runway.heading
        );
        feature.properties = {
          icao: runway.icao,
          ident,
          heading: (runway.heading - 90) % 360,
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
>(airports, $airports => {
  const data: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  $airports.forEach((airport: Airport) => {
    const { runways } = airport;
    for (const ident in runways) {
      const runway = runways[ident];
      if (runway.active_to) {
        const features: GeoJSON.Feature[] = departureArrows(
          [runway.longitude, runway.latitude],
          runway.heading,
          runway.length_ft
        );
        data.features.push(...features);
      }
    }
  });
  return data;
});
