import { useState } from "react";
import { Capacitor } from "@capacitor/core";

interface SearchResult {
  lat: number;
  lng: number;
  displayName: string;
  address: string;
}

interface SearchBarProps {
  onLocationSelect: (lat: number, lng: number) => void;
  searchProvider: "kakao" | "nominatim";
  isSeoul: boolean;
  cityCenter: { lat: number; lng: number };
}

const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_API_KEY;

const getApiBaseUrl = () => {
  if (Capacitor.isNativePlatform()) {
    return "https://dapi.kakao.com";
  }
  return "/api/kakao";
};

async function searchKakao(query: string): Promise<SearchResult[]> {
  const baseUrl = getApiBaseUrl();
  let searchResults: SearchResult[] = [];

  const keywordResponse = await fetch(
    `${baseUrl}/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`,
      },
    }
  );

  if (keywordResponse.ok) {
    const keywordData = await keywordResponse.json();
    if (keywordData.documents.length > 0) {
      searchResults = keywordData.documents.map(
        (item: { place_name: string; address_name: string; road_address_name: string; y: string; x: string }) => ({
          lat: parseFloat(item.y),
          lng: parseFloat(item.x),
          displayName: item.place_name,
          address: item.road_address_name || item.address_name,
        })
      );
    }
  }

  if (searchResults.length === 0) {
    const addressResponse = await fetch(
      `${baseUrl}/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_API_KEY}`,
        },
      }
    );

    if (addressResponse.ok) {
      const addressData = await addressResponse.json();
      searchResults = addressData.documents.map(
        (item: { address_name: string; y: string; x: string; road_address?: { address_name: string } }) => ({
          lat: parseFloat(item.y),
          lng: parseFloat(item.x),
          displayName: item.address_name,
          address: item.road_address?.address_name || item.address_name,
        })
      );
    }
  }

  return searchResults;
}

async function searchNominatim(query: string, center: { lat: number; lng: number }): Promise<SearchResult[]> {
  // Create a viewbox around the city center (~50km radius)
  const delta = 0.5;
  const viewbox = `${center.lng - delta},${center.lat + delta},${center.lng + delta},${center.lat - delta}`;
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&viewbox=${viewbox}&bounded=1`,
    {
      headers: {
        "Accept-Language": "en",
      },
    }
  );

  if (!response.ok) return [];

  const data = await response.json();
  return data.map(
    (item: { display_name: string; lat: string; lon: string; name?: string }) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.name || item.display_name.split(",")[0],
      address: item.display_name,
    })
  );
}

export default function SearchBar({ onLocationSelect, searchProvider, isSeoul, cityCenter }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchAddress = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setShowResults(true);

    try {
      const searchResults = searchProvider === "kakao"
        ? await searchKakao(query)
        : await searchNominatim(query, cityCenter);
      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    onLocationSelect(result.lat, result.lng);
    setQuery(result.displayName);
    setShowResults(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchAddress();
    }
  };

  const placeholder = isSeoul
    ? "주소 또는 장소를 입력하세요 (예: 도청로 65, 강남역)"
    : "Enter an address or place name";

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input"
        />
        <button onClick={searchAddress} className="search-button" disabled={isLoading}>
          {isLoading ? (isSeoul ? "검색중..." : "Searching...") : (isSeoul ? "검색" : "Search")}
        </button>
      </div>

      {showResults && results.length > 0 && (
        <ul className="search-results">
          {results.map((result, index) => (
            <li
              key={index}
              onClick={() => handleSelect(result)}
              className="search-result-item"
            >
              <div className="result-name">{result.displayName}</div>
              <div className="result-address">{result.address}</div>
            </li>
          ))}
        </ul>
      )}

      {showResults && !isLoading && results.length === 0 && query && (
        <div className="search-no-results">
          {isSeoul ? "검색 결과가 없습니다" : "No results found"}
        </div>
      )}
    </div>
  );
}
