import { useState, useCallback, useMemo } from "react";
import Map from "./components/Map";
import Map3D from "./components/Map3D";
import StationList from "./components/StationList";
import SearchBar from "./components/SearchBar";
import ControlPanel from "./components/ControlPanel";
import CurrentLocationButton from "./components/CurrentLocationButton";
import { STAGE_ORDER, type RedevelopmentStage } from "./data/redevelopment";
import { CITIES, CITY_LIST, type CityId } from "./data/cities";
import { cityStations, cityLineColors } from "./data/stations/index";
import type { StationWithDistance } from "./utils/distance";
import { useWalkingRoutes } from "./hooks/useWalkingRoutes";
import "./App.css";

function App() {
  const [selectedCity, setSelectedCity] = useState<CityId>("seoul");
  const [nearestStations, setNearestStations] = useState<StationWithDistance[]>([]);
  const [clickedPosition, setClickedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [is3D, setIs3D] = useState(false);
  const [showRedevelopment, setShowRedevelopment] = useState(true);
  const [selectedStages, setSelectedStages] = useState<RedevelopmentStage[]>([...STAGE_ORDER]);
  const [viewState, setViewState] = useState({
    longitude: CITIES.seoul.center.lng,
    latitude: CITIES.seoul.center.lat,
    zoom: 12,
    pitch: 45,
    bearing: 0,
  });
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [selectedStationIndex, setSelectedStationIndex] = useState<number | null>(null);

  const cityConfig = CITIES[selectedCity];
  const stations = useMemo(() => cityStations[selectedCity], [selectedCity]);
  const lineColors = useMemo(() => cityLineColors[selectedCity], [selectedCity]);
  const isSeoul = selectedCity === "seoul";

  const { stationsWithRoutes, isLoadingRoutes } = useWalkingRoutes(clickedPosition, nearestStations);

  const handleNearestStationsChange = useCallback((stns: StationWithDistance[], position: { lat: number; lng: number }) => {
    setNearestStations(stns);
    setClickedPosition(position);
    setSelectedStationIndex(null);
  }, []);

  const handleCityChange = useCallback((cityId: CityId) => {
    setSelectedCity(cityId);
    setNearestStations([]);
    setClickedPosition(null);
    setSearchedLocation(null);
    setSelectedStationIndex(null);
    const city = CITIES[cityId];
    setViewState((prev) => ({
      ...prev,
      latitude: city.center.lat,
      longitude: city.center.lng,
      zoom: city.zoom,
    }));
  }, []);

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setSearchedLocation({ lat, lng });
    setViewState((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      zoom: 15,
    }));
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>Subway Finder</h1>
          <a
            href="https://github.com/HongwooKim/subwayfinder"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
            title="View on GitHub"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
          <select
            className="city-selector"
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value as CityId)}
          >
            {CITY_LIST.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}{city.nameLocal ? ` (${city.nameLocal})` : ""}
              </option>
            ))}
          </select>
        </div>
        <p>
          {isSeoul
            ? "주소를 검색하거나 지도에서 위치를 클릭하세요"
            : "Search an address or click on the map"}
        </p>
      </header>
      <div className="search-container">
        <SearchBar
          key={selectedCity}
          onLocationSelect={handleLocationSelect}
          searchProvider={cityConfig.searchProvider}
          isSeoul={isSeoul}
          cityCenter={cityConfig.center}
        />
      </div>
      <main className="main">
        <div className="map-container">
          {is3D ? (
            <Map3D
              onNearestStationsChange={handleNearestStationsChange}
              searchedLocation={searchedLocation}
              viewState={viewState}
              onViewStateChange={setViewState}
              showRedevelopment={isSeoul && showRedevelopment}
              selectedStages={selectedStages}
              stations={stations}
              lineColors={lineColors}
              walkingRoutes={stationsWithRoutes}
              selectedStationIndex={selectedStationIndex}
            />
          ) : (
            <Map
              onNearestStationsChange={handleNearestStationsChange}
              searchedLocation={searchedLocation}
              showRedevelopment={isSeoul && showRedevelopment}
              selectedStages={selectedStages}
              stations={stations}
              lineColors={lineColors}
              cityCenter={cityConfig.center}
              cityZoom={cityConfig.zoom}
              walkingRoutes={stationsWithRoutes}
              selectedStationIndex={selectedStationIndex}
            />
          )}
          <CurrentLocationButton
            onLocationFound={handleLocationSelect}
            isSeoul={isSeoul}
          />
          <button
            className="control-panel-toggle"
            onClick={() => setShowControlPanel(!showControlPanel)}
            title={showControlPanel ? "Hide panel" : "Show panel"}
          >
            {showControlPanel ? "◀" : "▶"}
          </button>
          {showControlPanel && (
            <ControlPanel
              viewState={viewState}
              onViewStateChange={setViewState}
              is3D={is3D}
              onToggle3D={setIs3D}
              showRedevelopment={showRedevelopment}
              onToggleRedevelopment={setShowRedevelopment}
              selectedStages={selectedStages}
              onStageChange={setSelectedStages}
              isSeoul={isSeoul}
              cityCenter={cityConfig.center}
              cityZoom={cityConfig.zoom}
            />
          )}
        </div>
        <aside className="sidebar">
          <StationList
            stations={stationsWithRoutes}
            lineColors={lineColors}
            isSeoul={isSeoul}
            isLoadingRoutes={isLoadingRoutes}
            selectedStationIndex={selectedStationIndex}
            onStationSelect={setSelectedStationIndex}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;
