export type CityId = "seoul" | "tokyo" | "newyork" | "london" | "paris" | "beijing";

export interface CityConfig {
  id: CityId;
  name: string;
  nameLocal?: string;
  center: { lat: number; lng: number };
  zoom: number;
  searchProvider: "kakao" | "nominatim";
  hasRedevelopment: boolean;
  hasPoliticianProperties: boolean;
  country: string;
}

export const CITIES: Record<CityId, CityConfig> = {
  seoul: {
    id: "seoul",
    name: "Seoul",
    nameLocal: "서울",
    center: { lat: 37.5665, lng: 126.978 },
    zoom: 12,
    searchProvider: "kakao",
    hasRedevelopment: true,
    hasPoliticianProperties: true,
    country: "South Korea",
  },
  tokyo: {
    id: "tokyo",
    name: "Tokyo",
    nameLocal: "東京",
    center: { lat: 35.6812, lng: 139.7671 },
    zoom: 12,
    searchProvider: "nominatim",
    hasRedevelopment: false,
    hasPoliticianProperties: false,
    country: "Japan",
  },
  newyork: {
    id: "newyork",
    name: "New York",
    center: { lat: 40.7128, lng: -74.006 },
    zoom: 12,
    searchProvider: "nominatim",
    hasRedevelopment: false,
    hasPoliticianProperties: false,
    country: "United States",
  },
  london: {
    id: "london",
    name: "London",
    center: { lat: 51.5074, lng: -0.1278 },
    zoom: 12,
    searchProvider: "nominatim",
    hasRedevelopment: false,
    hasPoliticianProperties: false,
    country: "United Kingdom",
  },
  paris: {
    id: "paris",
    name: "Paris",
    center: { lat: 48.8566, lng: 2.3522 },
    zoom: 12,
    searchProvider: "nominatim",
    hasRedevelopment: false,
    hasPoliticianProperties: false,
    country: "France",
  },
  beijing: {
    id: "beijing",
    name: "Beijing",
    nameLocal: "北京",
    center: { lat: 39.9042, lng: 116.4074 },
    zoom: 12,
    searchProvider: "nominatim",
    hasRedevelopment: false,
    hasPoliticianProperties: false,
    country: "China",
  },
};

export const CITY_LIST: CityConfig[] = Object.values(CITIES);
