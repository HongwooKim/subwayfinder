import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Polygon,
  useMapEvents,
  useMap,
  CircleMarker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Station } from "../data/stations";
import { redevelopmentZones, STAGE_COLORS, type RedevelopmentStage } from "../data/redevelopment";
import type { StationWithDistance } from "../utils/distance";
import { findNearestStations } from "../utils/distance";
import type { StationWithRoute } from "../utils/routing";

// Fix for default marker icon
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapProps {
  onNearestStationsChange: (stations: StationWithDistance[], position: { lat: number; lng: number }) => void;
  searchedLocation: { lat: number; lng: number } | null;
  showRedevelopment: boolean;
  selectedStages: RedevelopmentStage[];
  stations: Station[];
  lineColors: Record<string, string>;
  cityCenter: { lat: number; lng: number };
  cityZoom: number;
  walkingRoutes: StationWithRoute[];
  selectedStationIndex: number | null;
}

interface LocationMarkerProps {
  onNearestStationsChange: (stations: StationWithDistance[], position: { lat: number; lng: number }) => void;
  searchedLocation: { lat: number; lng: number } | null;
  stations: Station[];
  lineColors: Record<string, string>;
  walkingRoutes: StationWithRoute[];
  selectedStationIndex: number | null;
}

function LocationMarker({ onNearestStationsChange, searchedLocation, stations, lineColors, walkingRoutes, selectedStationIndex }: LocationMarkerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [nearestStations, setNearestStations] = useState<StationWithDistance[]>([]);
  const map = useMap();

  useEffect(() => {
    if (searchedLocation) {
      const newPosition = L.latLng(searchedLocation.lat, searchedLocation.lng);
      setPosition(newPosition);
      map.flyTo(newPosition, 15, { duration: 1 });
      const nearest = findNearestStations(searchedLocation.lat, searchedLocation.lng, stations, 5);
      setNearestStations(nearest);
      onNearestStationsChange(nearest, { lat: searchedLocation.lat, lng: searchedLocation.lng });
    }
  }, [searchedLocation, map, onNearestStationsChange, stations]);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      const nearest = findNearestStations(e.latlng.lat, e.latlng.lng, stations, 5);
      setNearestStations(nearest);
      onNearestStationsChange(nearest, { lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return (
    <>
      {position && (
        <>
          <Marker position={position}>
            <Popup>
              Selected Location<br />
              Lat: {position.lat.toFixed(6)}<br />
              Lng: {position.lng.toFixed(6)}
            </Popup>
          </Marker>
          {nearestStations.map((station, index) => {
            if (selectedStationIndex !== null && selectedStationIndex !== index) return null;
            const isSelected = selectedStationIndex === index;
            const routeData = walkingRoutes.find(
              (r) => r.name === station.name && r.line === station.line
            );
            if (routeData?.walking) {
              return (
                <Polyline
                  key={`route-${station.name}-${station.line}-${index}`}
                  positions={routeData.walking.routeGeometry}
                  color={lineColors[station.line] || "#888"}
                  weight={isSelected ? 5 : 3}
                  opacity={0.8}
                />
              );
            }
            return (
              <Polyline
                key={`line-${station.name}-${station.line}-${index}`}
                positions={[
                  [position.lat, position.lng],
                  [station.lat, station.lng],
                ]}
                color={lineColors[station.line] || "#888"}
                weight={isSelected ? 4 : 2}
                opacity={0.7}
                dashArray="5, 10"
              />
            );
          })}
        </>
      )}
    </>
  );
}

export default function Map({
  onNearestStationsChange,
  searchedLocation,
  showRedevelopment,
  selectedStages,
  stations,
  lineColors,
  cityCenter,
  cityZoom,
  walkingRoutes,
  selectedStationIndex,
}: MapProps) {
  const [showAllStations, setShowAllStations] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  // Force re-mount MapContainer when city changes
  useEffect(() => {
    setMapKey((k) => k + 1);
  }, [cityCenter.lat, cityCenter.lng]);

  const filteredZones = redevelopmentZones.filter(
    zone => selectedStages.includes(zone.stage)
  );

  return (
    <div className="map-wrapper">
      <div className="map-controls">
        <label>
          <input
            type="checkbox"
            checked={showAllStations}
            onChange={(e) => setShowAllStations(e.target.checked)}
          />
          Show all stations
        </label>
      </div>
      <MapContainer
        key={mapKey}
        center={[cityCenter.lat, cityCenter.lng]}
        zoom={cityZoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          onNearestStationsChange={onNearestStationsChange}
          searchedLocation={searchedLocation}
          stations={stations}
          lineColors={lineColors}
          walkingRoutes={walkingRoutes}
          selectedStationIndex={selectedStationIndex}
        />

        {showRedevelopment && filteredZones.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])}
            pathOptions={{
              color: STAGE_COLORS[zone.stage],
              fillColor: STAGE_COLORS[zone.stage],
              fillOpacity: 0.4,
              weight: 2,
            }}
          >
            <Popup>
              <div className="zone-popup">
                <strong>{zone.name}</strong>
                <div className="zone-info">
                  <span className="zone-type" style={{
                    background: zone.type === "재개발" ? "#e74c3c" : "#3498db",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.75rem"
                  }}>
                    {zone.type}
                  </span>
                  <span className="zone-stage" style={{
                    background: STAGE_COLORS[zone.stage],
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    marginLeft: "4px"
                  }}>
                    {zone.stage}
                  </span>
                </div>
                <div style={{ marginTop: "8px", fontSize: "0.85rem" }}>
                  <div>구: {zone.district}</div>
                  {zone.estimatedUnits && <div>예상 세대수: {zone.estimatedUnits.toLocaleString()}세대</div>}
                  {zone.estimatedCompletion && <div>예상 준공: {zone.estimatedCompletion}년</div>}
                </div>
              </div>
            </Popup>
          </Polygon>
        ))}

        {showAllStations &&
          stations.map((station, index) => (
            <CircleMarker
              key={`${station.name}-${station.line}-${index}`}
              center={[station.lat, station.lng]}
              radius={5}
              fillColor={lineColors[station.line] || "#888"}
              color="#fff"
              weight={1}
              fillOpacity={0.8}
            >
              <Popup>
                <strong>{station.name}</strong>
                {station.nameEn && station.nameEn !== station.name && (
                  <><br />{station.nameEn}</>
                )}
                <br />
                {station.line}
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
}
