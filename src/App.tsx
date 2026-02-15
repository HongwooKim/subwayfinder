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
          <h1>Subway Station Finder</h1>
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
        <CurrentLocationButton
          onLocationFound={handleLocationSelect}
          isSeoul={isSeoul}
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
