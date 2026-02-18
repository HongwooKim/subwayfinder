// 뉴스타파 2025 공직자 재산공개 CSV → politicianProperties.ts 생성 스크립트
// 사용법:
//   기본 (구 중심 좌표): node scripts/generate-politicians-realestate.mjs
//   Kakao geocoding:     VITE_KAKAO_API_KEY=key node scripts/generate-politicians-realestate.mjs

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, "newstapa-jaesan-2025/CSV/newstapa-jaesan-2025-records.csv");
const OUTPUT_PATH = join(__dirname, "../src/data/politicianProperties.ts");

const KAKAO_API_KEY = process.env.VITE_KAKAO_API_KEY;

// 기관 매핑
function normalizeAgency(raw) {
  if (raw.includes("국회")) return "국회";
  if (raw.includes("정부")) return "정부";
  if (raw.includes("대법원")) return "대법원";
  if (raw.includes("헌법재판소")) return "헌재";
  if (raw.includes("선거관리")) return "선관위";
  return null;
}

// 서울 구별 중심 좌표 (geocoding 없이 사용)
const DISTRICT_COORDS = {
  "강남구": { lat: 37.5172, lng: 127.0473 },
  "강동구": { lat: 37.5301, lng: 127.1238 },
  "강북구": { lat: 37.6396, lng: 127.0254 },
  "강서구": { lat: 37.5509, lng: 126.8495 },
  "관악구": { lat: 37.4784, lng: 126.9516 },
  "광진구": { lat: 37.5385, lng: 127.0823 },
  "구로구": { lat: 37.4954, lng: 126.8874 },
  "금천구": { lat: 37.4569, lng: 126.8955 },
  "노원구": { lat: 37.6542, lng: 127.0568 },
  "도봉구": { lat: 37.6688, lng: 127.0471 },
  "동대문구": { lat: 37.5744, lng: 127.0396 },
  "동작구": { lat: 37.5124, lng: 126.9393 },
  "마포구": { lat: 37.5663, lng: 126.9014 },
  "서대문구": { lat: 37.5791, lng: 126.9368 },
  "서초구": { lat: 37.4837, lng: 127.0324 },
  "성동구": { lat: 37.5633, lng: 127.0371 },
  "성북구": { lat: 37.5894, lng: 127.0167 },
  "송파구": { lat: 37.5145, lng: 127.1059 },
  "양천구": { lat: 37.5169, lng: 126.8664 },
  "영등포구": { lat: 37.5264, lng: 126.8962 },
  "용산구": { lat: 37.5326, lng: 126.9906 },
  "은평구": { lat: 37.6027, lng: 126.9291 },
  "종로구": { lat: 37.5735, lng: 126.9790 },
  "중구": { lat: 37.5636, lng: 126.9975 },
  "중랑구": { lat: 37.6063, lng: 127.0925 },
};

// CSV 파싱 (큰따옴표 지원)
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text) {
  const lines = text.split("\n");
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || "").trim();
    });
    rows.push(row);
  }
  return rows;
}

// 서울 주소에서 구 이름 추출
function extractSeoulDistrict(description) {
  if (!description) return null;
  // 서울특별시 or 서울 다음에 오는 구 이름
  const match = description.match(/서울(?:특별시)?\s+(\S+구)/);
  return match ? match[1] : null;
}

// 면적 추출 (㎡)
function extractArea(description) {
  if (!description) return 0;
  // 마지막 ㎡ 앞의 숫자를 찾기 (실제 면적)
  const matches = [...description.matchAll(/([\d,.]+)\s*㎡/g)];
  if (matches.length > 0) {
    // 마지막 매치 사용 (보통 건물 면적이 뒤에 옴)
    return parseFloat(matches[matches.length - 1][1].replace(/,/g, ""));
  }
  return 0;
}

// 구 중심 좌표에 랜덤 오프셋 (같은 위치에 겹치지 않도록)
function getDistrictCoords(district) {
  const base = DISTRICT_COORDS[district];
  if (!base) return null;
  // ±0.005 (약 500m) 범위 랜덤 오프셋
  const offset = () => (Math.random() - 0.5) * 0.01;
  return {
    lat: base.lat + offset(),
    lng: base.lng + offset(),
  };
}

// Kakao Geocoding (API 키 있을 때만)
const geocodeCache = new Map();

async function geocode(address) {
  if (!KAKAO_API_KEY) return null;
  if (geocodeCache.has(address)) return geocodeCache.get(address);

  try {
    const response = await fetch(
      "https://dapi.kakao.com/v2/local/search/address.json?query=" + encodeURIComponent(address),
      { headers: { Authorization: "KakaoAK " + KAKAO_API_KEY } }
    );
    const data = await response.json();
    if (data.documents && data.documents.length > 0) {
      const result = { lat: parseFloat(data.documents[0].y), lng: parseFloat(data.documents[0].x) };
      geocodeCache.set(address, result);
      return result;
    }

    const kwResponse = await fetch(
      "https://dapi.kakao.com/v2/local/search/keyword.json?query=" + encodeURIComponent(address),
      { headers: { Authorization: "KakaoAK " + KAKAO_API_KEY } }
    );
    const kwData = await kwResponse.json();
    if (kwData.documents && kwData.documents.length > 0) {
      const result = { lat: parseFloat(kwData.documents[0].y), lng: parseFloat(kwData.documents[0].x) };
      geocodeCache.set(address, result);
      return result;
    }
  } catch (e) {
    console.error("Geocode error:", e.message);
  }

  geocodeCache.set(address, null);
  return null;
}

// 주소 축약 (팝업용)
function shortenAddress(description) {
  const match = description.match(/서울(?:특별시)?\s+\S+구\s+\S+동/);
  return match ? match[0] : description.substring(0, 30);
}

async function main() {
  console.log("Reading CSV:", CSV_PATH);
  const csvText = readFileSync(CSV_PATH, "utf-8");
  const rows = parseCSV(csvText);
  console.log(`Total rows: ${rows.length}`);

  // 컬럼: 순번,연도,관할기관,이름,소속,직위,본인과의 관계,재산 대분류,재산의 종류,소재지 면적 등 권리의 명세,...,현재가액,...

  // 건물/토지만 필터
  const propertyRows = rows.filter((row) => {
    const category = row["재산 대분류"] || "";
    return category === "건물" || category === "토지";
  });
  console.log(`Building/Land rows: ${propertyRows.length}`);

  // 서울 주소만 + 구 추출
  const seoulRows = [];
  for (const row of propertyRows) {
    const description = row["소재지 면적 등 권리의 명세"] || "";
    const district = extractSeoulDistrict(description);
    if (district && DISTRICT_COORDS[district]) {
      seoulRows.push({ ...row, district, description });
    }
  }
  console.log(`Seoul rows: ${seoulRows.length}`);

  // Geocoding or district-based coordinates
  const results = [];
  const useGeocoding = !!KAKAO_API_KEY;

  if (useGeocoding) {
    // Pre-geocode unique addresses
    const uniqueAddresses = [...new Set(seoulRows.map((r) => r.description.match(/서울[^\d]*/)?.[0] || "").filter(Boolean))];
    console.log(`Unique addresses to geocode: ${uniqueAddresses.length}`);
    for (let i = 0; i < uniqueAddresses.length; i++) {
      await geocode(uniqueAddresses[i]);
      if (i % 100 === 0) process.stdout.write(`\rGeocoding: ${i + 1}/${uniqueAddresses.length}`);
      await new Promise((r) => setTimeout(r, 30));
    }
    console.log("\nGeocoding complete.");
  } else {
    console.log("No KAKAO API key - using district center coordinates with random offset");
  }

  for (const row of seoulRows) {
    const agency = normalizeAgency(row["관할기관"] || "");
    if (!agency) continue;

    const category = row["재산 대분류"] || "";
    const description = row.description;

    // 좌표 결정
    let coords;
    if (useGeocoding) {
      const addrKey = description.match(/서울[^\d]*/)?.[0] || "";
      coords = geocodeCache.get(addrKey) || getDistrictCoords(row.district);
    } else {
      coords = getDistrictCoords(row.district);
    }
    if (!coords) continue;

    const valueStr = row["현재가액"] || "0";
    const value = parseInt(valueStr.replace(/,/g, ""), 10) * 1000 || 0; // 천원 → 원

    results.push({
      name: row["이름"] || "",
      position: row["직위"] || "",
      party: "",
      agency,
      propertyType: category === "건물" ? "건물" : "토지",
      address: shortenAddress(description),
      addressFull: description,
      area: extractArea(description),
      value,
      lat: coords.lat,
      lng: coords.lng,
    });
  }

  console.log(`Final results: ${results.length}`);

  // Generate TypeScript
  const today = new Date().toISOString().split("T")[0];

  let output = `// 고위공직자 부동산 데이터 (뉴스타파 2025 재산공개 기준)
// 생성일: ${today}
// 총 ${results.length}건 (서울 지역 건물/토지)
// 출처: 뉴스타파 2025 공직자 재산공개 (jaesan.newstapa.org)

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
  isSample?: boolean;
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

export const politicianProperties: PoliticianProperty[] = [
`;

  results.forEach((p, i) => {
    const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ");
    output += `  {
    id: "pp-${i + 1}",
    name: "${esc(p.name)}",
    position: "${esc(p.position)}",
    party: "${esc(p.party)}",
    agency: "${p.agency}",
    propertyType: "${p.propertyType}",
    address: "${esc(p.address)}",
    addressFull: "${esc(p.addressFull)}",
    area: ${p.area},
    value: ${p.value},
    lat: ${p.lat},
    lng: ${p.lng},
  },\n`;
  });

  output += `];\n`;

  writeFileSync(OUTPUT_PATH, output);
  console.log(`\nSaved to ${OUTPUT_PATH}`);

  // Statistics
  const agencyStats = {};
  const typeStats = {};
  const districtStats = {};
  results.forEach((p) => {
    agencyStats[p.agency] = (agencyStats[p.agency] || 0) + 1;
    typeStats[p.propertyType] = (typeStats[p.propertyType] || 0) + 1;
    const d = p.address.match(/\S+구/)?.[0] || "기타";
    districtStats[d] = (districtStats[d] || 0) + 1;
  });

  console.log("\nAgency distribution:");
  Object.entries(agencyStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log("\nProperty type distribution:");
  Object.entries(typeStats).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log("\nTop 10 districts:");
  Object.entries(districtStats).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
}

main();
