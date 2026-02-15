import { useState, useCallback } from "react";
import { Map } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { LineLayer, PathLayer, ScatterplotLayer, ColumnLayer, PolygonLayer } from "@deck.gl/layers";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Station } from "../data/stations";
import { redevelopmentZones, STAGE_COLORS, type RedevelopmentStage, type RedevelopmentZone } from "../data/redevelopment";
import type { StationWithDistance } from "../utils/distance";
import { findNearestStations } from "../utils/distance";
import type { PickingInfo } from "@deck.gl/core";
import type { StationWithRoute } from "../utils/routing";

interface Map3DProps {
  onNearestStationsChange: (stations: StationWithDistance[], position: { lat: number; lng: number }) => void;
  searchedLocation: { lat: number; lng: number } | null;
  viewState: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
  onViewStateChange: (viewState: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
  }) => void;
  showRedevelopment: boolean;
  selectedStages: RedevelopmentStage[];
  stations: Station[];
  lineColors: Record<string, string>;
  walkingRoutes: StationWithRoute[];
  selectedStationIndex: number | null;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export default function Map3D({
  onNearestStationsChange,
  searchedLocation,
  viewState,
  onViewStateChange,
  showRedevelopment,
  selectedStages,
  stations,
  lineColors,
  walkingRoutes,
  selectedStationIndex,
}: Map3DProps) {
  const [selectedPosition, setSelectedPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nearestStations, setNearestStations] = useState<StationWithDistance[]>(
    []
  );

  const handleClick = useCallback(
    (info: PickingInfo) => {
      let coord = info.coordinate;
      if (!coord && info.viewport) {
        coord = info.viewport.unproject([info.x, info.y]);
      }
      if (coord) {
        const [lng, lat] = coord;
        setSelectedPosition({ lat, lng });
        const nearest = findNearestStations(lat, lng, stations, 5);
        setNearestStations(nearest);
        onNearestStationsChange(nearest, { lat, lng });
      }
    },
    [onNearestStationsChange, stations]
  );

  // 검색된 위치로 이동
  const currentPosition = searchedLocation || selectedPosition;

  // 검색 위치가 변경되면 업데이트
  if (
    searchedLocation &&
    (!selectedPosition ||
      selectedPosition.lat !== searchedLocation.lat ||
      selectedPosition.lng !== searchedLocation.lng)
  ) {
    setSelectedPosition(searchedLocation);
    const nearest = findNearestStations(
      searchedLocation.lat,
      searchedLocation.lng,
      stations,
      5
    );
    setNearestStations(nearest);
    onNearestStationsChange(nearest, searchedLocation);
  }

  const filteredZones = redevelopmentZones.filter(
    zone => selectedStages.includes(zone.stage)
  );

  // Filter by selected station, then separate by walking route availability
  const visibleRoutes = selectedStationIndex !== null
    ? walkingRoutes.filter((_, i) => i === selectedStationIndex)
    : walkingRoutes;
  const routesWithPath = visibleRoutes.filter((r) => r.walking);
  const routesWithoutPath = visibleRoutes.filter((r) => !r.walking);

  const layers = [
    showRedevelopment && new PolygonLayer<RedevelopmentZone>({
      id: "redevelopment-zones",
      data: filteredZones,
      getPolygon: (d) => d.coordinates,
      getFillColor: (d) => {
        const [r, g, b] = hexToRgb(STAGE_COLORS[d.stage]);
        return [r, g, b, 150];
      },
      getLineColor: (d) => {
        const [r, g, b] = hexToRgb(STAGE_COLORS[d.stage]);
        return [r, g, b, 255];
      },
      getLineWidth: 2,
      extruded: true,
      getElevation: (d) => {
        const stageIndex = ["후보지", "정비구역지정", "추진위승인", "조합설립", "사업시행인가", "관리처분인가", "착공", "준공"].indexOf(d.stage);
        return (stageIndex + 1) * 50;
      },
      elevationScale: 1,
      pickable: true,
    }),

    new ColumnLayer<Station>({
      id: "stations-column",
      data: stations,
      getPosition: (d) => [d.lng, d.lat],
      getElevation: 100,
      elevationScale: 1,
      radius: 50,
      getFillColor: (d) => {
        const [r, g, b] = hexToRgb(lineColors[d.line] || "#888888");
        return [r, g, b, 200];
      },
      pickable: true,
    }),

    currentPosition &&
      new ScatterplotLayer({
        id: "selected-position",
        data: [currentPosition],
        getPosition: (d) => [d.lng, d.lat],
        getRadius: 100,
        getFillColor: [255, 0, 0, 200],
        pickable: false,
      }),

    // Walking route paths (solid, actual road geometry)
    currentPosition &&
      routesWithPath.length > 0 &&
      new PathLayer<StationWithRoute>({
        id: "walking-route-paths",
        data: routesWithPath,
        getPath: (d) => d.walking!.routeGeometryLngLat,
        getColor: (d) => {
          const [r, g, b] = hexToRgb(lineColors[d.line] || "#888888");
          return [r, g, b, 220];
        },
        getWidth: 4,
        widthUnits: "pixels",
        pickable: false,
      }),

    // Fallback straight lines for stations without walking routes
    currentPosition &&
      routesWithoutPath.length > 0 &&
      new LineLayer<StationWithRoute>({
        id: "station-lines-fallback",
        data: routesWithoutPath,
        getSourcePosition: () => [currentPosition.lng, currentPosition.lat, 0],
        getTargetPosition: (d) => [d.lng, d.lat, 100],
        getColor: (d) => {
          const [r, g, b] = hexToRgb(lineColors[d.line] || "#888888");
          return [r, g, b, 180];
        },
        getWidth: 2,
        pickable: false,
      }),

    currentPosition &&
      nearestStations.length > 0 &&
      new ColumnLayer<StationWithDistance>({
        id: "nearest-stations-highlight",
        data: nearestStations,
        getPosition: (d) => [d.lng, d.lat],
        getElevation: (d) => Math.max(500 - d.distance * 200, 200),
        elevationScale: 1,
        radius: 80,
        getFillColor: (d) => {
          const [r, g, b] = hexToRgb(lineColors[d.line] || "#888888");
          return [r, g, b, 255];
        },
        pickable: true,
      }),
  ].filter(Boolean);

  return (
    <div className="map-wrapper">
      <DeckGL
        viewState={viewState}
        onViewStateChange={(e) => onViewStateChange(e.viewState as typeof viewState)}
        controller={true}
        layers={layers}
        onClick={handleClick}
        getTooltip={({ object }: PickingInfo) => {
          if (!object) return null;

          if ("stage" in object) {
            const zone = object as RedevelopmentZone;
            return {
              html: `<div>
                <strong>${zone.name}</strong><br/>
                <span style="color: ${zone.type === "재개발" ? "#e74c3c" : "#3498db"}">${zone.type}</span> ·
                <span style="color: ${STAGE_COLORS[zone.stage]}">${zone.stage}</span><br/>
                ${zone.district}${zone.estimatedUnits ? `<br/>예상 ${zone.estimatedUnits.toLocaleString()}세대` : ""}
                ${zone.estimatedCompletion ? `<br/>준공 ${zone.estimatedCompletion}년` : ""}
              </div>`,
              style: {
                backgroundColor: "#fff",
                padding: "8px",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              },
            };
          }

          if ("name" in object) {
            const station = object as StationWithDistance;
            const nameDisplay = station.nameEn && station.nameEn !== station.name
              ? `${station.name} (${station.nameEn})`
              : station.name;
            return {
              html: `<div><strong>${nameDisplay}</strong><br/>${station.line}${station.distance ? `<br/>${(station.distance * 1000).toFixed(0)}m` : ""}</div>`,
              style: {
                backgroundColor: "#fff",
                padding: "8px",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              },
            };
          }
          return null;
        }}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          attributionControl={false}
        />
      </DeckGL>
    </div>
  );
}
