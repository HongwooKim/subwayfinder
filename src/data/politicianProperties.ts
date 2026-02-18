// 고위공직자 부동산 데이터 (뉴스타파 2025 재산공개 기준)
// 생성일: 2026-02-18
// 출처: 뉴스타파 2025 공직자 재산공개

export type ManagingAgency = "국회" | "정부" | "대법원" | "선관위" | "헌재";

export interface PoliticianProperty {
  id: string;
  name: string;
  position: string;
  party: string;
  agency: ManagingAgency;
  propertyType: "건물" | "토지";
  address: string;
  addressFull: string;
  area: number;
  value: number;
  lat: number;
  lng: number;
}

export const AGENCY_COLORS: Record<ManagingAgency, string> = {
  "국회": "#E53935",
  "정부": "#1E88E5",
  "대법원": "#43A047",
  "선관위": "#FB8C00",
  "헌재": "#8E24AA",
};

export const AGENCY_ORDER: ManagingAgency[] = [
  "국회",
  "정부",
  "대법원",
  "선관위",
  "헌재",
];

// 샘플 데이터 - scripts/generate-politicians-realestate.mjs 로 실제 데이터 생성
export const politicianProperties: PoliticianProperty[] = [
  {
    id: "pp-1",
    name: "홍길동",
    position: "국회의원",
    party: "더불어민주당",
    agency: "국회",
    propertyType: "건물",
    address: "서울 강남구 삼성동",
    addressFull: "서울특별시 강남구 삼성동 123-45",
    area: 165.5,
    value: 2500000000,
    lat: 37.5088,
    lng: 127.0632,
  },
  {
    id: "pp-2",
    name: "김철수",
    position: "국회의원",
    party: "국민의힘",
    agency: "국회",
    propertyType: "토지",
    address: "서울 서초구 서초동",
    addressFull: "서울특별시 서초구 서초동 678-90",
    area: 330.0,
    value: 5000000000,
    lat: 37.4837,
    lng: 127.0089,
  },
  {
    id: "pp-3",
    name: "이영희",
    position: "장관",
    party: "",
    agency: "정부",
    propertyType: "건물",
    address: "서울 용산구 한남동",
    addressFull: "서울특별시 용산구 한남동 111-22",
    area: 250.0,
    value: 8000000000,
    lat: 37.5340,
    lng: 127.0026,
  },
  {
    id: "pp-4",
    name: "박민수",
    position: "대법관",
    party: "",
    agency: "대법원",
    propertyType: "건물",
    address: "서울 서초구 반포동",
    addressFull: "서울특별시 서초구 반포동 333-44",
    area: 198.0,
    value: 3200000000,
    lat: 37.5056,
    lng: 126.9882,
  },
  {
    id: "pp-5",
    name: "정수진",
    position: "선관위원",
    party: "",
    agency: "선관위",
    propertyType: "토지",
    address: "서울 종로구 삼청동",
    addressFull: "서울특별시 종로구 삼청동 55-66",
    area: 450.0,
    value: 4000000000,
    lat: 37.5842,
    lng: 126.9822,
  },
  {
    id: "pp-6",
    name: "최판사",
    position: "헌법재판관",
    party: "",
    agency: "헌재",
    propertyType: "건물",
    address: "서울 종로구 재동",
    addressFull: "서울특별시 종로구 재동 77-88",
    area: 180.0,
    value: 2800000000,
    lat: 37.5795,
    lng: 126.9870,
  },
];
