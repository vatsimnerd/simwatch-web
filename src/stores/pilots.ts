import {
  derived,
  Readable,
  readable,
  Subscriber,
  Writable,
  writable,
} from "svelte/store";
import { api } from "../apiconnect";
import type { Pilot, TrackPoint } from "../types";
import { messages } from "./messages";

let tracked: string | null = null;
const trackedPilot = writable<Pilot | null>(null);
const _planeFilter = writable<string | null>(null);

export const subscribeID = async (id: string) => {
  return api.subscribeID(id).catch((err: Error) => {
    messages.alert(err.message);
  });
};

export const unsubscribeID = async (id: string) => {
  return api.unsubscribeID(id).catch((err: Error) => {
    messages.alert(err.message);
  });
};

export const loadTrackedPilot = async (callsign: string) => {
  return api
    .getPilot(callsign)
    .then((pilot) => {
      trackedPilot.set(pilot);
      tracked = pilot.callsign;
    })
    .catch((err) => {
      messages.error(err);
    });
};

export const unloadTrackedPilot = async () => {
  tracked = null;
  trackedPilot.set(null);
};

export const focusedPilot = derived(
  trackedPilot,
  ($trackedPilot) => $trackedPilot
);

export const pilots = readable<{ [key: string]: Pilot }>(
  {},
  (set: Subscriber<{ [key: string]: Pilot }>) => {
    let pilots: { [key: string]: Pilot } = {};

    const add = (objects: Pilot[]) => {
      pilots = {
        ...pilots,
        ...objects.reduce<{ [key: string]: Pilot }>((acc, item) => {
          // I know, side-effect in reduce is meh..
          if (item.callsign === tracked) {
            loadTrackedPilot(tracked);
          }

          acc[item.callsign] = item;
          return acc;
        }, {}),
      };
      set(pilots);
    };

    const remove = (objects: Pilot[]) => {
      objects.forEach((pilot) => {
        delete pilots[pilot.callsign];
      });
      set(pilots);
    };

    const reset = () => {
      set({});
    };

    api.on("set-pilot", add);
    api.on("del-pilot", remove);
    api.on("reset", reset);
    return () => {
      api.off("set-pilot", add);
      api.off("del-pilot", remove);
      api.off("reset", reset);
    };
  }
);

export const pilotsGeoJSON = derived<
  Readable<{ [key: string]: Pilot }>,
  GeoJSON.FeatureCollection
>(pilots, ($pilots) => {
  const data: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  for (const callsign in $pilots) {
    const pilot = $pilots[callsign];
    let rotation = pilot.heading - 90;

    const atype = pilot.aircraft_type ? pilot.aircraft_type.engine_type : "Jet";

    let icon = "airplane_jet";
    let size = 0.1;
    if (atype !== "Jet") {
      icon = "airplane_ga";
      size = 0.014;
      rotation += 45;
    }
    const feature: GeoJSON.Feature = {
      type: "Feature",
      properties: {
        callsign,
        rotation,
        icon,
        size,
      },
      geometry: {
        type: "Point",
        coordinates: [pilot.longitude, pilot.latitude],
      },
    };
    data.features.push(feature);
  }
  return data;
});

export const setupFilter = async (query: string) => {
  return api
    .setPlaneFilter(query)
    .then(() => {
      _planeFilter.set(query);
    })
    .catch((err) => {
      messages.alert(err);
    });
};

export const planeFilter = derived<Writable<string>, string>(
  _planeFilter,
  ($_planeFilter) => {
    return $_planeFilter;
  }
);

export const trackGeoJSON = derived<Writable<Pilot>, GeoJSON.FeatureCollection>(
  trackedPilot,
  ($trackedPilot: Pilot) => {
    const data: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };
    if ($trackedPilot) {
      data.features.push({
        type: "Feature",
        properties: {
          callsign: $trackedPilot.callsign,
        },
        geometry: {
          type: "LineString",
          coordinates: $trackedPilot.track.map((point: TrackPoint) => [
            point.lng,
            point.lat,
          ]),
        },
      });
    }
    return data;
  }
);
