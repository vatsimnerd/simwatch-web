import {
  MapBounds,
  SimError,
  SimEvent,
  SimEventType,
  SimRequest,
  SimResponse,
  Pilot,
  SimEventObjectType,
} from "./types";

import Axios from "axios";
import { __BACKEND_HTTP_BASEURI__, __BACKEND_WS_BASEURI__ } from "./secrets";

type Handler = (args: any) => void;

type APIConnectEvent =
  | "set-airport"
  | "del-airport"
  | "set-radar"
  | "del-radar"
  | "set-pilot"
  | "del-pilot"
  | "reset"
  | "error"
  | "status"
  | "send"
  | "receive"
  | "connect"
  | "open"
  | "close";

class APIConnect {
  private static WS_ENDPOINT = `${__BACKEND_WS_BASEURI__}/api/updates`;
  private static MAX_DELAY = 45000; // if there's no messages in 45 seconds, reset
  private static eventNames: APIConnectEvent[] = [
    "set-airport",
    "del-airport",
    "set-radar",
    "del-radar",
    "set-pilot",
    "del-pilot",
    "reset",
    "error",
    "status",
    "send",
    "receive",
    "connect",
    "open",
    "close",
  ];

  private handlers: { [key: string]: Handler[] };
  private ws: WebSocket;
  private connected: boolean;
  private requestQueue: SimRequest[];

  private _oncls: () => void;
  private _onmsg: () => void;
  private _onopen: () => void;
  private bounds: MapBounds;
  private includeUncontrolled: boolean;
  private _lastUpdate: Date;

  constructor() {
    this.handlers = APIConnect.eventNames.reduce((acc, evName) => {
      acc[evName] = [];
      return acc;
    }, {});

    this.ws = null;
    this.connected = false;
    this.requestQueue = [];
    this.includeUncontrolled = false;

    this._oncls = this.onClose.bind(this);
    this._onmsg = this.onMessage.bind(this);
    this._onopen = this.onOpen.bind(this);
    setInterval(this.checkExpired.bind(this), 5000);
  }

  public get lastUpdate() {
    return this._lastUpdate;
  }

  private checkExpired() {
    if (!this._lastUpdate) return;
    const dt = new Date();
    const dur = dt.getTime() - this._lastUpdate.getTime();
    if (dur > APIConnect.MAX_DELAY) {
      this.reset();
    }
  }

  reset() {
    console.log("reset!");
    this.emit("reset");
    this.onClose();
  }

  on(evName: APIConnectEvent, handler: Handler) {
    this.handlers[evName].push(handler);
  }

  off(evName: APIConnectEvent, handler: Handler) {
    const idx = this.handlers[evName].indexOf(handler);
    if (idx >= 0) {
      this.handlers[evName].splice(idx, 1);
    }
  }

  private emit(evName: string, ...args: any[]) {
    this.handlers[evName].forEach((handler) => {
      handler.apply(null, args);
    });
  }

  private dispose() {
    if (this.ws) {
      this.ws.removeEventListener("open", this._onopen);
      this.ws.removeEventListener("message", this._onmsg);
      this.ws.removeEventListener("close", this._oncls);
      this.ws.close();
      this.ws = null;
    }
  }

  private onOpen() {
    this.emit("open");
    this.connected = true;
    this.setAirportFilter(this.includeUncontrolled);
    if (this.bounds) {
      this.setBounds(this.bounds);
    }
    this.processQueue();
  }

  private onClose() {
    this.emit("close");
    this.dispose();
    // in either case let's try to reconnect
    setTimeout(() => {
      this._reconnect();
    }, 3000);
  }

  private _processEvent(event: SimEvent) {
    switch (event.e_type) {
      case SimEventType.SET:
        switch (event.o_type) {
          case SimEventObjectType.AIRPORT:
            this.emit("set-airport", event.objects);
            break;
          case SimEventObjectType.RADAR:
            this.emit("set-radar", event.objects);
            break;
          case SimEventObjectType.PILOT:
            this.emit("set-pilot", event.objects);
        }
        break;
      case SimEventType.DELETE:
        switch (event.o_type) {
          case SimEventObjectType.AIRPORT:
            this.emit("del-airport", event.objects);
            break;
          case SimEventObjectType.RADAR:
            this.emit("del-radar", event.objects);
            break;
          case SimEventObjectType.PILOT:
            this.emit("del-pilot", event.objects);
        }
        break;
    }
  }

  private onMessage(message: MessageEvent<any>) {
    this._lastUpdate = new Date();
    const response: SimResponse = JSON.parse(message.data);

    switch (response.type) {
      case "error":
        this.emit("error", (response.payload as SimError).error);
        break;
      case "status":
        this.emit("status", response.payload);
        break;
      case "update":
        const event = response.payload as SimEvent;
        this.emit("receive", event);
        this._processEvent(event);
        break;
    }
  }

  private _reconnect() {
    const ep = APIConnect.WS_ENDPOINT;

    this.emit("connect");
    this.ws = new WebSocket(ep);
    this.ws.addEventListener("open", this._onopen);
    this.ws.addEventListener("message", this._onmsg);
    this.ws.addEventListener("close", this._oncls);
  }

  private processQueue() {
    if (!this.ws) {
      this._reconnect();
      return;
    }

    if (!this.connected) return;
    if (!this.requestQueue.length) return;

    let queue = [...this.requestQueue];
    while (queue.length) {
      const [req, ...rest] = queue;
      queue = rest;
      this.ws.send(JSON.stringify(req));
      this.emit("send");
    }

    this.requestQueue = [];
  }

  private _push(req: SimRequest) {
    this.requestQueue = [...this.requestQueue, req];
    this.processQueue();
  }

  setBounds(bounds: MapBounds) {
    const req = new SimRequest("bounds", bounds);
    this.bounds = bounds;
    this._push(req);
  }

  setAirportFilter(include_uncontrolled: boolean) {
    const req = new SimRequest("airport_filter", { include_uncontrolled });
    this.includeUncontrolled = include_uncontrolled;
    this._push(req);
  }

  async subscribeID(id: string): Promise<any> {}
  async unsubscribeID(id: string): Promise<any> {}
  async setPlaneFilter(query: string): Promise<any> {
    const req = new SimRequest("pilot_filter", { query });
    this._push(req);
  }

  async getPilot(callsign: string): Promise<Pilot> {
    const { data } = await Axios.get(
      `${__BACKEND_HTTP_BASEURI__}/api/pilots/${callsign}`
    );
    return data as Pilot;
  }
}

export const api = new APIConnect();
window["api"] = api;
