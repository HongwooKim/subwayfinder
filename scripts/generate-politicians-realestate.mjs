// 뉴스타파 2025 공직자 재산공개 CSV → politicianProperties.ts 생성 스크립트
// 사용법: VITE_KAKAO_API_KEY=your_key node scripts/generate-politicians-realestate.mjs path/to/newstapa.csv

import { readFileSync, writeFileSync } from "fs";

const KAKAO_API_KEY = process.env.VITE_KAKAO_API_KEY;
if (!KAKAO_API_KEY) {
  console.error("Error: VITE_KAKAO_API_KEY environment variable is required");
  process.exit(1);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/generate-politicians-realestate.mjs <csv-file>");
  process.exit(1);
}

// 기관 매핑
const AGENCY_MAP = {
  "국회": "국회",
  "정부": "정부",
  "대법원": "대법원",
  "선관위": "선관위",
  "헌재": "헌재",
  "헌법재판소": "헌재",
  "중앙선거관리위원회": "선관위",
};

function normalizeAgency(raw) {
  for (const [key, value] of Object.entries(AGENCY_MAP)) {
    if (raw.includes(key)) return value;
  }
  return null;
}

// CSV 파싱 (간단한 구현 - 쉼표 구분, 큰따옴표 지원)
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

// 주소에서 서울 여부 확인 및 주소 추출
function extractSeoulAddress(description) {
  if (!description) return null;

  // "소재지 면적 등 권리의 명세" 필드에서 주소 파싱
  // 서울특별시 또는 서울로 시작하는 주소 찾기
  const patterns = [
    /서울특별시\s+\S+구\s+\S+동[^,\n]*/g,
    /서울\s+\S+구\s+\S+동[^,\n]*/g,
    /서울특별시\s+\S+구\s+[^,\n]+/g,
    /서울\s+\S+구\s+[^,\n]+/g,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) return match[0].trim();
  }
  return null;
}

// 면적 추출 (㎡)
function extractArea(description) {
  if (!description) return 0;
  const match = description.match(/([\d,.]+)\s*㎡/);
  if (match) return parseFloat(match[1].replace(/,/g, ""));
  // 평 단위
  const pyMatch = description.match(/([\d,.]+)\s*평/);
  if (pyMatch) return parseFloat(pyMatch[1].replace(/,/g, "")) * 3.3058;
  return 0;
}

// Geocoding with cache
const geocodeCache = new Map();

async function geocode(address) {
  if (geocodeCache.has(address)) return geocodeCache.get(address);

  try {
    const response = await fetch(
      "https://dapi.kakao.com/v2/local/search/address.json?query=" + encodeURIComponent(address),
      { headers: { Authorization: "KakaoAK " + KAKAO_API_KEY } }
    );
    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      const result = {
        lat: parseFloat(data.documents[0].y),
        lng: parseFloat(data.documents[0].x),
      };
      geocodeCache.set(address, result);
      return result;
    }

    // Fallback: keyword search
    const kwResponse = await fetch(
      "https://dapi.kakao.com/v2/local/search/keyword.json?query=" + encodeURIComponent(address),
      { headers: { Authorization: "KakaoAK " + KAKAO_API_KEY } }
    );
    const kwData = await kwResponse.json();

    if (kwData.documents && kwData.documents.length > 0) {
      const result = {
        lat: parseFloat(kwData.documents[0].y),
        lng: parseFloat(kwData.documents[0].x),
      };
      geocodeCache.set(address, result);
      return result;
    }
  } catch (e) {
    console.error("Geocode error for", address, ":", e.message);
  }

  geocodeCache.set(address, null);
  return null;
}

// 가액 파싱 (천원 단위 → 원 단위)
function parseValue(valueStr) {
  if (!valueStr) return 0;
  const num = parseInt(valueStr.replace(/,/g, ""), 10);
  return isNaN(num) ? 0 : num * 1000; // CSV의 가액이 천원 단위인 경우
}

async function main() {
  console.log("Reading CSV:", csvPath);
  const csvText = readFileSync(csvPath, "utf-8");
  const rows = parseCSV(csvText);
  console.log(`Total rows: ${rows.length}`);

  // 건물/토지만 필터
  // CSV 컬럼명은 실제 데이터에 맞게 조정 필요
  const propertyRows = rows.filter((row) => {
    const category = row["재산구분"] || row["재산의 종류"] || "";
    return category.includes("건물") || category.includes("토지");
  });
  console.log(`Building/Land rows: ${propertyRows.length}`);

  // 서울 주소만 필터 + 주소 추출
  const seoulRows = [];
  for (const row of propertyRows) {
    const description = row["소재지 면적 등 권리의 명세"] || row["소재지면적등"] || row["명세"] || "";
    const address = extractSeoulAddress(description);
    if (address) {
      seoulRows.push({ ...row, extractedAddress: address, rawDescription: description });
    }
  }
  console.log(`Seoul rows: ${seoulRows.length}`);

  // Geocoding
  const results = [];
  const uniqueAddresses = [...new Set(seoulRows.map((r) => r.extractedAddress))];
  console.log(`Unique addresses to geocode: ${uniqueAddresses.length}`);

  // Pre-geocode all unique addresses
  for (let i = 0; i < uniqueAddresses.length; i++) {
    await geocode(uniqueAddresses[i]);
    process.stdout.write(`\rGeocoding: ${i + 1}/${uniqueAddresses.length}`);
    await new Promise((r) => setTimeout(r, 30)); // Rate limit
  }
  console.log("\nGeocoding complete.");

  // Build results
  for (const row of seoulRows) {
    const coords = geocodeCache.get(row.extractedAddress);
    if (!coords) continue;

    const agency = normalizeAgency(row["관리기관"] || row["소속기관"] || row["기관"] || "");
    if (!agency) continue;

    const category = row["재산구분"] || row["재산의 종류"] || "";
    const propertyType = category.includes("건물") ? "건물" : "토지";

    results.push({
      name: row["성명"] || row["공직자성명"] || "",
      position: row["직위"] || row["직책"] || "",
      party: row["정당"] || row["소속정당"] || "",
      agency,
      propertyType,
      address: row.extractedAddress,
      addressFull: row.rawDescription,
      area: extractArea(row.rawDescription),
      value: parseValue(row["신고가액(천원)"] || row["가액"] || "0"),
      lat: coords.lat,
      lng: coords.lng,
    });
  }

  console.log(`Final results: ${results.length}`);

  // Generate TypeScript
  const today = new Date().toISOString().split("T")[0];

  let output = `// 고위공직자 부동산 데이터 (뉴스타파 2025 재산공개 기준)
// 생성일: ${today}
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
    const escapedName = p.name.replace(/"/g, '\\"');
    const escapedPosition = p.position.replace(/"/g, '\\"');
    const escapedParty = p.party.replace(/"/g, '\\"');
    const escapedAddress = p.address.replace(/"/g, '\\"');
    const escapedFull = p.addressFull.replace(/"/g, '\\"').replace(/\n/g, " ");
    output += `  {
    id: "pp-${i + 1}",
    name: "${escapedName}",
    position: "${escapedPosition}",
    party: "${escapedParty}",
    agency: "${p.agency}",
    propertyType: "${p.propertyType}",
    address: "${escapedAddress}",
    addressFull: "${escapedFull}",
    area: ${p.area},
    value: ${p.value},
    lat: ${p.lat},
    lng: ${p.lng},
  },\n`;
  });

  output += `];\n`;

  writeFileSync("src/data/politicianProperties.ts", output);
  console.log("\nSaved to src/data/politicianProperties.ts");

  // Statistics
  const agencyStats = {};
  const typeStats = {};
  results.forEach((p) => {
    agencyStats[p.agency] = (agencyStats[p.agency] || 0) + 1;
    typeStats[p.propertyType] = (typeStats[p.propertyType] || 0) + 1;
  });

  console.log("\nAgency distribution:");
  Object.entries(agencyStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([agency, count]) => {
      console.log(`  ${agency}: ${count}`);
    });

  console.log("\nProperty type distribution:");
  Object.entries(typeStats).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
}

main();
