import { destination, point, Position, Point, Feature } from "@turf/turf";

export const planeClusterPaint = {
  "circle-color": "rgba(0, 0, 0, 0.5)",
  "circle-radius": ["step", ["get", "point_count"], 20, 10, 25, 50, 30],
};
export const planeClusterCount = {
  "text-field": "{point_count_abbreviated}",
  "text-font": ["Montserrat"],
  "text-size": 14,
};

export const firsFillPaint = {
  "fill-color": "#333333",
  "fill-opacity": 0.2,
};
export const firsStrokePaint = {
  "line-color": "#333333",
};

export const approachFillPaint = {
  "fill-color": "#335599",
  "fill-opacity": 0.2,
};
export const approachStrokePaint = {
  "line-color": "#335599",
};

export const trackPaint = {
  "line-color": "#449944",
  "line-width": 2,
};

export const arrivalsFillPaint = {
  "fill-color": "#339933",
  "fill-opacity": 0.2,
};
export const arrivalsStrokePaint = {
  "line-color": "#339933",
};
export const departuresFillPaint = {
  "fill-color": "#113399",
  "fill-opacity": 0.2,
};
export const departuresStrokePaint = {
  "line-color": "#113399",
};
export const runwaysFilter = [">=", ["zoom"], 10];

const ILS_POLY_LENGTH_MI = 2.0;
const ILS_POLY_SPREAD_DEG = 2.5;

type Vector = {
  length: number;
  angle: number;
};

export const rasterisePoly = (
  start: Position,
  vectors: Vector[],
  rotation: number
): Position[] => {
  let current = point(start);
  const points: Feature<Point>[] = [current];
  vectors.forEach(vector => {
    const next = destination(
      current.geometry.coordinates,
      vector.length,
      (rotation + vector.angle) % 360,
      { units: "miles" }
    );
    points.push(next);
    current = next;
  });
  points.push(point(start));

  return points.map(point => point.geometry.coordinates);
};

export const ilsPoly = (
  start: Position,
  heading: number,
  length = ILS_POLY_LENGTH_MI
) => {
  const startPoint = point(start);
  const rev = (heading + 180) % 360;

  const dirs = [
    [rev - ILS_POLY_SPREAD_DEG, length],
    [rev, length * 0.95],
    [rev + ILS_POLY_SPREAD_DEG, length],
  ];

  const points = [
    startPoint,
    ...dirs.map(([angle, len]) => {
      if (angle > 180) angle = angle - 360;
      return destination(start, len, angle, { units: "miles" });
    }),
    startPoint,
  ];

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [points.map(point => point.geometry.coordinates)],
    },
  } as GeoJSON.Feature;
};

export const departureArrows = (
  start: Position,
  heading: number,
  length: number
): GeoJSON.Feature[] => {
  const step = 0.15; // step between arrows

  // runway length in miles
  length = length / 5800;

  // vector representation of the arrow
  const vectors: Vector[] = [
    { length: 0.1, angle: 135 },
    { length: 0.03, angle: 180 },
    { length: 0.1, angle: -45 },
    { length: 0.1, angle: -135 },
    { length: 0.03, angle: 0 },
  ];

  let iter = step;
  let current = point(start);
  const coordinates: Position[][] = [];
  while (iter < length) {
    current = destination(current.geometry.coordinates, step, heading, {
      units: "miles",
    });
    coordinates.push(
      rasterisePoly(current.geometry.coordinates, vectors, heading)
    );
    iter += step;
  }

  return coordinates.map(cset => ({
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [cset],
    },
    properties: {},
  }));
};
