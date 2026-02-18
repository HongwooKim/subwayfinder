import { STAGE_COLORS, STAGE_ORDER, type RedevelopmentStage } from "../data/redevelopment";
import { AGENCY_COLORS, AGENCY_ORDER, type ManagingAgency } from "../data/politicianProperties";

interface ControlPanelProps {
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
  is3D: boolean;
  onToggle3D: (is3D: boolean) => void;
  showRedevelopment: boolean;
  onToggleRedevelopment: (show: boolean) => void;
  selectedStages: RedevelopmentStage[];
  onStageChange: (stages: RedevelopmentStage[]) => void;
  isSeoul: boolean;
  cityCenter: { lat: number; lng: number };
  cityZoom: number;
  showPoliticianProperties: boolean;
  onTogglePoliticianProperties: (show: boolean) => void;
  selectedAgencies: ManagingAgency[];
  onAgencyChange: (agencies: ManagingAgency[]) => void;
}

export default function ControlPanel({
  viewState,
  onViewStateChange,
  is3D,
  onToggle3D,
  showRedevelopment,
  onToggleRedevelopment,
  selectedStages,
  onStageChange,
  isSeoul,
  cityCenter,
  cityZoom,
  showPoliticianProperties,
  onTogglePoliticianProperties,
  selectedAgencies,
  onAgencyChange,
}: ControlPanelProps) {
  const handleChange = (key: keyof typeof viewState, value: number) => {
    onViewStateChange({
      ...viewState,
      [key]: value,
    });
  };

  const resetView = () => {
    onViewStateChange({
      longitude: cityCenter.lng,
      latitude: cityCenter.lat,
      zoom: cityZoom,
      pitch: 45,
      bearing: 0,
    });
  };

  const toggleStage = (stage: RedevelopmentStage) => {
    if (selectedStages.includes(stage)) {
      onStageChange(selectedStages.filter((s) => s !== stage));
    } else {
      onStageChange([...selectedStages, stage]);
    }
  };

  const selectAllStages = () => {
    onStageChange([...STAGE_ORDER]);
  };

  const clearAllStages = () => {
    onStageChange([]);
  };

  const toggleAgency = (agency: ManagingAgency) => {
    if (selectedAgencies.includes(agency)) {
      onAgencyChange(selectedAgencies.filter((a) => a !== agency));
    } else {
      onAgencyChange([...selectedAgencies, agency]);
    }
  };

  const selectAllAgencies = () => {
    onAgencyChange([...AGENCY_ORDER]);
  };

  const clearAllAgencies = () => {
    onAgencyChange([]);
  };

  return (
    <div className="control-panel">
      <div className="control-header">
        <h3>{isSeoul ? "지도 설정" : "Map Settings"}</h3>
        <button className="reset-button" onClick={resetView}>
          {isSeoul ? "초기화" : "Reset"}
        </button>
      </div>

      <div className="control-toggle">
        <button
          className={`toggle-button ${!is3D ? "active" : ""}`}
          onClick={() => onToggle3D(false)}
        >
          2D
        </button>
        <button
          className={`toggle-button ${is3D ? "active" : ""}`}
          onClick={() => onToggle3D(true)}
        >
          3D
        </button>
      </div>

      {is3D && (
        <>
          <div className="control-group">
            <label>
              {isSeoul ? "기울기" : "Tilt"}: {viewState.pitch.toFixed(0)}°
              <input
                type="range"
                min="0"
                max="85"
                value={viewState.pitch}
                onChange={(e) => handleChange("pitch", Number(e.target.value))}
              />
            </label>
          </div>

          <div className="control-group">
            <label>
              {isSeoul ? "회전" : "Rotation"}: {viewState.bearing.toFixed(0)}°
              <input
                type="range"
                min="-180"
                max="180"
                value={viewState.bearing}
                onChange={(e) => handleChange("bearing", Number(e.target.value))}
              />
            </label>
          </div>
        </>
      )}

      {isSeoul && (
        <>
          <div className="control-divider" />

          <div className="control-section">
            <div className="control-section-header">
              <h4>재개발/재건축</h4>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={showRedevelopment}
                  onChange={(e) => onToggleRedevelopment(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {showRedevelopment && (
              <div className="stage-filters">
                <div className="stage-filter-actions">
                  <button onClick={selectAllStages}>전체 선택</button>
                  <button onClick={clearAllStages}>전체 해제</button>
                </div>
                {STAGE_ORDER.map((stage) => (
                  <label key={stage} className="stage-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedStages.includes(stage)}
                      onChange={() => toggleStage(stage)}
                    />
                    <span
                      className="stage-color"
                      style={{ backgroundColor: STAGE_COLORS[stage] }}
                    />
                    <span className="stage-name">{stage}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="control-divider" />

          <div className="control-section">
            <div className="control-section-header">
              <h4>고위공직자 부동산</h4>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={showPoliticianProperties}
                  onChange={(e) => onTogglePoliticianProperties(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {showPoliticianProperties && (
              <div className="stage-filters">
                <div className="stage-filter-actions">
                  <button onClick={selectAllAgencies}>전체 선택</button>
                  <button onClick={clearAllAgencies}>전체 해제</button>
                </div>
                {AGENCY_ORDER.map((agency) => (
                  <label key={agency} className="stage-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedAgencies.includes(agency)}
                      onChange={() => toggleAgency(agency)}
                    />
                    <span
                      className="stage-color"
                      style={{ backgroundColor: AGENCY_COLORS[agency] }}
                    />
                    <span className="stage-name">{agency}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
