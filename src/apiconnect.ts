import type {
  MapBoundsEx,
  APIConnectEvent,
  APIConnectHandler,
  APIConnectState,
  APIConnectServerUpdate,
  Pilot,
} from "./types";
import Axios from "axios";
import { mbEq } from "./misc";

class APIConnect {
  private handlers: Record<APIConnectEvent, APIConnectHandler[]>;
  private es: EventSource | null = null;
  private bounds: MapBoundsEx | null = null;
  private pFilter: string | null = null;
  private showWx: boolean = false;
  private subIds: Set<string>;
  private state: APIConnectState;
  private reconnecting = false;

  private _onerr: () => void;
  private _onmsg: () => void;
  private _onopen: () => void;

  constructor() {
    this._onerr = this.onError.bind(this);
    this._onmsg = this.onMessage.bind(this);
    this._onopen = this.onOpen.bind(this);

    this.handlers = {
      close: [],
      connect: [],
      error: [],
      "set-pilots": [],
      "del-pilots": [],
      "set-airports": [],
      "del-airports": [],
      "set-firs": [],
      "del-firs": [],
    };

    this.state = {
      pilots: {},
      airports: {},
      firs: {},
    };
    this.subIds = new Set();
  }

  on(evName: APIConnectEvent, handler: APIConnectHandler) {
    if (evName in this.handlers) {
      this.handlers[evName].push(handler);
    }
  }

  off(evName: APIConnectEvent, handler: APIConnectHandler) {
    if (evName in this.handlers) {
      const idx = this.handlers[evName].indexOf(handler);
      if (idx >= 0) {
        this.handlers[evName].splice(idx, 1);
      }
    }
  }

  setBounds(bounds: MapBoundsEx) {
    if (this.bounds && mbEq(bounds, this.bounds)) return;
    this.bounds = bounds;
    this._reconnect();
  }

  setWeather(value: boolean) {
    this.showWx = value;
    this._reconnect();
  }

  async setFilter(query: string): Promise<boolean> {
    if (query === this.pFilter) return false;

    const checkResult = await this.checkQuery(query);
    if (checkResult) {
      this.pFilter = query;
      this._reconnect();
    }
    return checkResult;
  }

  resetFilter() {
    if (!this.pFilter) return;
    this.pFilter = null;
    this._reconnect();
  }

  subscribeID(id: string) {
    if (this.subIds.has(id)) return;
    this.subIds.add(id);
    this._reconnect();
  }

  unsubscribeID(id: string) {
    if (!this.subIds.has(id)) return;
    this.subIds.add(id);
    this._reconnect();
  }

  async getPilot(callsign: string): Promise<Pilot> {
    return await Axios.get<Pilot, any>(`/api/pilots/${callsign}`).then(
      resp => resp.data
    );
  }

  private async checkQuery(query: string): Promise<boolean> {
    query = encodeURIComponent(query);
    return await Axios.get(`/api/chkquery?query=${query}`)
      .then(() => true)
      .catch(err => {
        const message =
          err.response?.data?.error || "unidentified error in query";
        this.emit("error", message);
        return false;
      });
  }

  private emit(evName: APIConnectEvent, ...args: any[]) {
    this.handlers[evName].forEach(handler => {
      handler.apply(null, args);
    });
  }

  private onOpen() {
    this.emit("connect");
  }

  private onError(e: ErrorEvent) {
    const message = e.error || e.message || "EventSource unidentified error";
    this.emit("error", message);
    // in either case let's try to reconnect
    setTimeout(() => {
      this._reconnect();
    }, 3000);
  }

  private onMessage(message: MessageEvent<any>) {
    let update: APIConnectServerUpdate;
    try {
      update = JSON.parse(message.data);
    } catch {
      console.log("error parsing update");
    }

    if (this.reconnecting) {
      // when reconnecting fields is true, server has just started
      // from scratch and might not have sent deletes we need
      //
      // hence we adjust diff manually
      this.reconnecting = false;

      // let's collect what we got from server
      const pilot_ids = new Set(
        update.data.set?.pilots?.map(pilot => pilot.callsign) || []
      );
      const airport_ids = new Set(
        update.data.set?.airports?.map(arpt => `${arpt.icao}:${arpt.iata}`) ||
          []
      );
      const fir_ids = new Set(
        update.data.set?.firs?.map(fir => fir.icao) || []
      );

      if (!update.data.delete) {
        update.data.delete = {
          pilots: [],
          airports: [],
          firs: [],
        };
      }

      Object.entries(this.state.pilots).forEach(([callsign, pilot]) => {
        if (!pilot_ids.has(callsign)) {
          update.data.delete?.pilots?.push(pilot);
        }
      });
      Object.entries(this.state.airports).forEach(([code, airport]) => {
        if (!airport_ids.has(code)) {
          update.data.delete?.airports?.push(airport);
        }
      });
      Object.entries(this.state.firs).forEach(([id, fir]) => {
        if (!fir_ids.has(id)) {
          update.data.delete?.firs?.push(fir);
        }
      });
    }

    update.data.set?.pilots?.forEach(pilot => {
      this.state.pilots[pilot.callsign] = pilot;
    });
    update.data.delete?.pilots?.forEach(pilot => {
      delete this.state.pilots[pilot.callsign];
    });

    update.data.set?.airports?.forEach(arpt => {
      this.state.airports[`${arpt.icao}:${arpt.iata}`] = arpt;
    });
    update.data.delete?.airports?.forEach(arpt => {
      delete this.state.airports[`${arpt.icao}:${arpt.iata}`];
    });

    update.data.set?.firs?.forEach(fir => {
      this.state.firs[fir.icao] = fir;
    });
    update.data.delete?.firs?.forEach(fir => {
      delete this.state.firs[fir.icao];
    });

    if (update.data.set?.pilots?.length > 0)
      this.emit("set-pilots", update.data.set.pilots);
    if (update.data.delete?.pilots?.length > 0)
      this.emit("del-pilots", update.data.delete.pilots);
    if (update.data.set?.airports?.length > 0)
      this.emit("set-airports", update.data.set.airports);
    if (update.data.delete?.airports?.length > 0)
      this.emit("del-airports", update.data.delete.airports);
    if (update.data.set?.firs?.length > 0)
      this.emit("set-firs", update.data.set.firs);
    if (update.data.delete?.firs?.length > 0)
      this.emit("del-firs", update.data.delete.firs);
  }

  private _reconnect() {
    if (!this.bounds) return;
    if (this.es) {
      this.es.close();
      this.es.removeEventListener("open", this._onopen);
      this.es.removeEventListener("message", this._onmsg);
      this.es.removeEventListener("error", this._onerr);
      this.es = null;
    }

    this.reconnecting = true;
    const url = this.genURL();
    this.es = new EventSource(url);
    this.es.addEventListener("open", this._onopen);
    this.es.addEventListener("message", this._onmsg);
    this.es.addEventListener("error", this._onerr);
  }

  private genURL() {
    const { min, max, zoom } = this.bounds;
    const path = `/api/updates/${min.lng}/${min.lat}/${max.lng}/${max.lat}/${zoom}`;
    const usp = new URLSearchParams();
    if (this.pFilter) {
      usp.set("query", this.pFilter);
    }
    if (this.showWx) {
      usp.set("show_wx", "true");
    }
    const qs = Array.from(usp).length > 0 ? `?${usp.toString()}` : "";
    return `${path}${qs}`;
  }
}

export const api = new APIConnect();
window["api"] = api;
