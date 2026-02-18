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

// scripts/generate-politicians-realestate.mjs 로 실제 데이터 생성
// 사용법: VITE_KAKAO_API_KEY=your_key node scripts/generate-politicians-realestate.mjs path/to/newstapa.csv
export const politicianProperties: PoliticianProperty[] = [];
