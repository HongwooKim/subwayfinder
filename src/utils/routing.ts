import type { StationWithDistance } from "./distance";

export interface WalkingRoute {
  walkingDuration: number; // seconds
  walkingDistance: number; // meters
  routeGeometry: [number, number][]; // [lat, lng][] for Leaflet
  routeGeometryLngLat: [number, number][]; // [lng, lat][] for DeckGL
  routeStatus: "loaded" | "error";
}

export interface StationWithRoute extends StationWithDistance {
  walking?: WalkingRoute;
}

export async function fetchWalkingRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  signal?: AbortSignal
): Promise<WalkingRoute | null> {
  try {
    const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;

    const route = data.routes[0];
    const coords: [number, number][] = route.geometry.coordinates; // [lng, lat][]

    return {
      walkingDuration: route.duration,
      walkingDistance: route.distance,
      routeGeometry: coords.map(([lng, lat]) => [lat, lng] as [number, number]),
      routeGeometryLngLat: coords,
      routeStatus: "loaded",
    };
  } catch {
    return null;
  }
}

export function formatWalkingTime(seconds: number, isSeoul: boolean): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return isSeoul ? "1분 미만" : "<1 min";
  return isSeoul ? `도보 ${minutes}분` : `${minutes} min walk`;
}

export function formatWalkingDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
