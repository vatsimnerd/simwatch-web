import type { Airport } from "./types";

function deg2rad(angle: number) {
  return angle * (Math.PI / 180);
}

export function processWeather(arpt: Airport) {
  if (arpt.wx) {
    arpt.wx.callsign = `${arpt.icao} METAR`;
    if (typeof arpt.wx.wind_direction === "number") {
      const wind_dir = arpt.wx.wind_direction as number;

      let active_land = Object.values(arpt.runways).find(rwy => rwy.active_lnd);
      let active_to = Object.values(arpt.runways).find(rwy => rwy.active_to);

      if (!active_land) {
        let resAngle = 360;
        Object.values(arpt.runways).forEach(rwy => {
          const angle = Math.abs(rwy.heading - wind_dir);
          if (angle < resAngle) {
            resAngle = angle;
            active_land = rwy;
          }
        });
      }

      if (!active_to) {
        let resAngle = 360;
        Object.values(arpt.runways).forEach(rwy => {
          const angle = Math.abs(rwy.heading - wind_dir);
          if (angle < resAngle) {
            resAngle = angle;
            active_to = rwy;
          }
        });
      }

      const to_wind_angle = Math.abs(wind_dir - active_to.heading);
      const land_wind_angle = Math.abs(wind_dir - active_land.heading);

      arpt.wx.side_wind_to = Math.round(
        Math.abs(arpt.wx.wind_speed * Math.sin(deg2rad(to_wind_angle)))
      );
      arpt.wx.side_wind_lnd = Math.round(
        Math.abs(arpt.wx.wind_speed * Math.sin(deg2rad(land_wind_angle)))
      );
    } else {
      arpt.wx.side_wind_to = 0;
      arpt.wx.side_wind_lnd = 0;
    }
  }
  return arpt;
}

export enum WindSpeed {
  CALM,
  LIGHT,
  STRONG,
  SEVERE,
}

export function estimateWindSpeed(landing: number, takeoff: number) {
  const speed = Math.max(landing, takeoff);
  if (speed <= 1) {
    return WindSpeed.CALM;
  } else if (speed <= 7) {
    return WindSpeed.LIGHT;
  } else if (speed <= 15) {
    return WindSpeed.STRONG;
  } else {
    return WindSpeed.SEVERE;
  }
}
