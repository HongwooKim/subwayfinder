import type { StationWithRoute } from "../utils/routing";
import { formatWalkingTime, formatWalkingDistance } from "../utils/routing";
import { formatDistance } from "../utils/distance";

interface StationListProps {
  stations: StationWithRoute[];
  lineColors: Record<string, string>;
  isSeoul: boolean;
  isLoadingRoutes: boolean;
  selectedStationIndex: number | null;
  onStationSelect: (index: number | null) => void;
}

export default function StationList({ stations, lineColors, isSeoul, isLoadingRoutes, selectedStationIndex, onStationSelect }: StationListProps) {
  if (stations.length === 0) {
    return (
      <div className="station-list">
        <h2>{isSeoul ? "가까운 지하철역" : "Nearby Stations"}</h2>
        <p className="empty-message">
          {isSeoul ? "지도에서 위치를 클릭하세요" : "Click on the map to select a location"}
        </p>
      </div>
    );
  }

  return (
    <div className="station-list">
      <h2>{isSeoul ? "가까운 지하철역" : "Nearby Stations"}</h2>
      <ul>
        {stations.map((station, index) => (
          <li
            key={`${station.name}-${station.line}-${index}`}
            className={`station-item${selectedStationIndex === index ? " station-item-selected" : ""}`}
            onClick={() => onStationSelect(selectedStationIndex === index ? null : index)}
          >
            <div className="station-rank">{index + 1}</div>
            <div className="station-info">
              <div className="station-name">
                {station.name}
                {station.nameEn && station.nameEn !== station.name && (
                  <span className="station-name-en"> {station.nameEn}</span>
                )}
              </div>
              <div
                className="station-line"
                style={{ backgroundColor: lineColors[station.line] || "#888" }}
              >
                {station.line}
              </div>
            </div>
            <div className="station-distance-info">
              {station.walking ? (
                <>
                  <div className="station-walking-time">
                    {formatWalkingTime(station.walking.walkingDuration, isSeoul)}
                  </div>
                  <div className="station-walking-distance">
                    {formatWalkingDistance(station.walking.walkingDistance)}
                  </div>
                  <div className="station-distance-straight">
                    {formatDistance(station.distance)}
                  </div>
                </>
              ) : isLoadingRoutes ? (
                <>
                  <div className="station-walking-time station-walking-loading">...</div>
                  <div className="station-distance">{formatDistance(station.distance)}</div>
                </>
              ) : (
                <div className="station-distance">{formatDistance(station.distance)}</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
