import { useState, useEffect, useRef } from "react";
import type { StationWithDistance } from "../utils/distance";
import type { StationWithRoute } from "../utils/routing";
import { fetchWalkingRoute } from "../utils/routing";

export function useWalkingRoutes(
  origin: { lat: number; lng: number } | null,
  stations: StationWithDistance[]
): { stationsWithRoutes: StationWithRoute[]; isLoadingRoutes: boolean } {
  const [routes, setRoutes] = useState<Map<string, StationWithRoute["walking"]>>(new Map());
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!origin || stations.length === 0) {
      setRoutes(new Map());
      return;
    }

    // Abort previous requests
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoadingRoutes(true);

    const stationKeys = stations.map((s) => `${s.name}-${s.line}`);

    Promise.all(
      stations.map((station) =>
        fetchWalkingRoute(
          origin.lat,
          origin.lng,
          station.lat,
          station.lng,
          controller.signal
        )
      )
    )
      .then((results) => {
        if (controller.signal.aborted) return;
        const newRoutes = new Map<string, StationWithRoute["walking"]>();
        results.forEach((route, i) => {
          if (route) {
            newRoutes.set(stationKeys[i], route);
          }
        });
        setRoutes(newRoutes);
        setIsLoadingRoutes(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setIsLoadingRoutes(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [origin?.lat, origin?.lng, stations]);

  const stationsWithRoutes: StationWithRoute[] = stations.map((station) => ({
    ...station,
    walking: routes.get(`${station.name}-${station.line}`),
  }));

  return { stationsWithRoutes, isLoadingRoutes };
}
