import type { Station } from "../data/stations";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export interface StationWithDistance extends Station {
  distance: number;
}

export function findNearestStations(
  lat: number,
  lng: number,
  stations: Station[],
  count: number = 5
): StationWithDistance[] {
  const stationsWithDistance = stations.map((station) => ({
    ...station,
    distance: calculateDistance(lat, lng, station.lat, station.lng),
  }));

  stationsWithDistance.sort((a, b) => a.distance - b.distance);

  return stationsWithDistance.slice(0, count);
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(2)}km`;
}
