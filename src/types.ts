export type Point = {
  lat: number;
  lng: number;
};

export type MapBounds = {
  min: Point;
  max: Point;
};

export type Airport = {
  icao: string;
  iata: string;
  name: string;
  fir_id: string;
  is_pseudo: boolean;
  position: Point;
  ctrls: ControllerSet;
  rwys: { [key: string]: Runway };
};

export type Controller = {
  cid: number;
  name: string;
  human_readable: string;
  callsign: string;
  frequency: number;
  facility: number;
  rating: number;
  server: string;
  visual_range: number;
  atis_code: string;
  text_atis: string;
  logon_time: Date;
  last_updated: Date;
};

export type ControllerSet = {
  atis: Controller | null;
  delivery: Controller | null;
  ground: Controller | null;
  tower: Controller | null;
  approach: Controller | null;
};

export type AircraftType = {
  name: string;
  description: string;
  wtc: string;
  wtg: string;
  designator: string;
  manufacturer_code: string;
  engine_count: number;
  engine_type: string;
};

export type Pilot = {
  cid: number;
  name: string;
  callsign: string;
  server: string;
  pilot_rating: number;
  position: Point;
  altitude: number;
  groundspeed: number;
  heading: number;
  qnh_i_hg: number;
  qnh_mb: number;
  transponder: string;
  logon_time: Date;
  last_updated: Date;
  flight_plan: FlightPlan | null;
  track?: TrackPoint[];
  aircraft_type: AircraftType | null;
};

export type FlightPlan = {
  flight_rules: string;
  aircraft: string;
  departure: string;
  arrival: string;
  alternate: string;
  cruise_tas: string;
  altitude: string;
  deptime: string;
  enroute_time: string;
  fuel_time: string;
  remarks: string;
  route: string;
};

export type Radar = {
  ctrl: Controller;
  firs: FIR[];
};

export type FIR = {
  id: string;
  name: string;
  prefix: string;
  parent_id: string;
  boundaries: Boundaries;
};

export type Boundaries = {
  id: string;
  region: string;
  division: string;
  is_oceanic: boolean;
  min: Point;
  max: Point;
  center: Point;
  points: Point[][];
};

export type VatsimObject = Pilot | Radar | Airport;

export type TrackPoint = {
  lat: number;
  lng: number;
  hdg: number;
  alt: number;
  gs: number;
  ts: number;
};

export type Runway = {
  icao: string;
  ident: string;
  length_ft: number;
  width_ft: number;
  surface: string;
  lighted: boolean;
  closed: boolean;
  lat: number;
  lng: number;
  elev_ft: number;
  hdg: number;
  active_to: boolean;
  active_lnd: boolean;
};

export enum RadarToggleType {
  PILOTS,
  ATC,
}

export type APIConnectHandler = (args: any) => void;
export type APIConnectEvent =
  | "connect"
  | "close"
  | "set-pilots"
  | "set-airports"
  | "set-firs"
  | "del-pilots"
  | "del-airports"
  | "del-firs";
export type APIConnectState = {
  pilots: Record<string, Pilot>;
  airports: Record<string, Airport>;
  firs: Record<string, FIR>;
};

export type APIConnectServerUpdate = {
  connection_id: string;
  message_type: string;
  data: {
    set: {
      pilots: Pilot[];
      airports: Airport[];
      firs: FIR[];
    };
    delete: {
      pilots: Pilot[];
      airports: Airport[];
      firs: FIR[];
    };
  };
};
