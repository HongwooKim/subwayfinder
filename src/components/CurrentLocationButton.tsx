import { useEffect } from "react";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import "../styles/CurrentLocationButton.css";

interface CurrentLocationButtonProps {
  onLocationFound: (lat: number, lng: number) => void;
  isSeoul: boolean;
}

export default function CurrentLocationButton({
  onLocationFound,
  isSeoul,
}: CurrentLocationButtonProps) {
  const { latitude, longitude, accuracy, error, loading, requestLocation } =
    useCurrentLocation();

  const handleClick = async () => {
    requestLocation();
  };

  // Auto-call onLocationFound when location is retrieved
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      onLocationFound(latitude, longitude);
    }
  }, [latitude, longitude, onLocationFound]);

  return (
    <div className="current-location-button-container">
      <button
        className="current-location-button"
        onClick={handleClick}
        disabled={loading}
        title={isSeoul ? "현재 위치 찾기" : "Find current location"}
      >
        <span className="location-icon">📍</span>
        {loading ? (
          <span>{isSeoul ? "위치 확인 중..." : "Finding..."}</span>
        ) : (
          <span>{isSeoul ? "현재 위치" : "My Location"}</span>
        )}
      </button>
      {accuracy !== null && (
        <div className="accuracy-info">
          <small>
            {isSeoul
              ? `정확도: ${accuracy.toFixed(0)}m`
              : `Accuracy: ${accuracy.toFixed(0)}m`}
          </small>
        </div>
      )}
      {error && (
        <div className="error-message">
          <small style={{ color: "#d32f2f" }}>{error}</small>
        </div>
      )}
    </div>
  );
}
