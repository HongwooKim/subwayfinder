const KAKAO_API_KEY = "dc5039a6428787151fa6afc2777aac06";

async function fetchAllProjects() {
  const projects = [];

  // Fetch all data in one request (total ~1100 projects)
  console.log('Fetching all projects...');
  const response = await fetch('https://cleanup.seoul.go.kr/cleanup/bsnssttus/lsubBsnsSttus.do', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'pageNo=1&pageSize=1200',
  });

  const html = await response.text();
  const pattern = /<tr>\s*<td>(\d+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>/g;

  let match;
  while ((match = pattern.exec(html)) !== null) {
    projects.push({
      num: match[1],
      district: match[2].trim(),
      type: match[3].trim(),
      name: match[4].trim(),
      address: match[5].trim(),
      stage: match[6].trim(),
    });
  }

  return projects;
}

async function geocode(address, district) {
  const fullAddress = "서울특별시 " + district + " " + address;

  try {
    const response = await fetch(
      "https://dapi.kakao.com/v2/local/search/address.json?query=" + encodeURIComponent(fullAddress),
      { headers: { Authorization: "KakaoAK " + KAKAO_API_KEY } }
    );

    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      return { lat: parseFloat(data.documents[0].y), lng: parseFloat(data.documents[0].x) };
    }

    const kwResponse = await fetch(
      "https://dapi.kakao.com/v2/local/search/keyword.json?query=" + encodeURIComponent(fullAddress),
      { headers: { Authorization: "KakaoAK " + KAKAO_API_KEY } }
    );

    const kwData = await kwResponse.json();

    if (kwData.documents && kwData.documents.length > 0) {
      return { lat: parseFloat(kwData.documents[0].y), lng: parseFloat(kwData.documents[0].x) };
    }
  } catch (e) {
    console.error("Geocode error:", e.message);
  }

  return null;
}

function normalizeStage(stage) {
  const map = {
    '안전진단': '후보지',
    '정비계획 수립': '후보지',
    '추진주체구성전': '후보지',
    '정비구역지정': '정비구역지정',
    '추진위원회승인': '추진위승인',
    '추진위원회': '추진위승인',
    '조합설립인가': '조합설립',
    '사업시행인가': '사업시행인가',
    '관리처분인가': '관리처분인가',
    '착공': '착공',
    '철거': '착공',
    '준공인가': '준공',
    '이전고시': '준공',
    '조합해산': '준공',
    '조합청산': '준공',
  };
  return map[stage] || '후보지';
}

function normalizeType(type) {
  if (type.includes('재개발')) return '재개발';
  return '재건축';
}

function createPolygon(lat, lng, size = 0.0015) {
  return [
    [lng - size, lat - size],
    [lng + size, lat - size],
    [lng + size, lat + size],
    [lng - size, lat + size],
    [lng - size, lat - size],
  ];
}

async function main() {
  console.log('Fetching all projects from 정비사업 정보몽땅...');
  const allProjects = await fetchAllProjects();
  console.log(`Total: ${allProjects.length} projects`);

  // 진행 중인 프로젝트만 (완료된 프로젝트 제외)
  const active = allProjects.filter(p => !['조합해산', '조합청산', '이전고시'].includes(p.stage));
  console.log(`Active: ${active.length} projects`);

  // 좌표 변환
  const results = [];

  for (let i = 0; i < active.length; i++) {
    const p = active[i];
    const coords = await geocode(p.address, p.district);

    if (coords) {
      results.push({ ...p, ...coords });
      process.stdout.write(`\r[${i+1}/${active.length}] Geocoded: ${results.length}`);
    }

    await new Promise(r => setTimeout(r, 30)); // Rate limit
  }

  console.log(`\n\nSuccessfully geocoded: ${results.length} projects`);

  // TypeScript 생성
  const today = new Date().toISOString().split('T')[0];

  let output = `// 실제 서울시 정비사업 데이터 (정비사업 정보몽땅 기준)
// 생성일: ${today}
// 출처: https://cleanup.seoul.go.kr

export type RedevelopmentStage =
  | "후보지"
  | "정비구역지정"
  | "추진위승인"
  | "조합설립"
  | "사업시행인가"
  | "관리처분인가"
  | "착공"
  | "준공";

export interface RedevelopmentZone {
  id: string;
  name: string;
  type: "재개발" | "재건축";
  stage: RedevelopmentStage;
  district: string;
  coordinates: [number, number][];
  estimatedUnits?: number;
  estimatedCompletion?: string;
}

export const STAGE_COLORS: Record<RedevelopmentStage, string> = {
  "후보지": "#9E9E9E",
  "정비구역지정": "#FF9800",
  "추진위승인": "#FFC107",
  "조합설립": "#8BC34A",
  "사업시행인가": "#4CAF50",
  "관리처분인가": "#00BCD4",
  "착공": "#2196F3",
  "준공": "#673AB7",
};

export const STAGE_ORDER: RedevelopmentStage[] = [
  "후보지",
  "정비구역지정",
  "추진위승인",
  "조합설립",
  "사업시행인가",
  "관리처분인가",
  "착공",
  "준공",
];

export const redevelopmentZones: RedevelopmentZone[] = [
`;

  results.forEach((p, i) => {
    const escapedName = p.name.replace(/"/g, '\\"');
    output += `  {
    id: "zone-${i + 1}",
    name: "${escapedName}",
    type: "${normalizeType(p.type)}",
    stage: "${normalizeStage(p.stage)}",
    district: "${p.district}",
    coordinates: ${JSON.stringify(createPolygon(p.lat, p.lng))},
  },\n`;
  });

  output += `];
`;

  // 파일 저장
  const fs = await import('fs');
  fs.writeFileSync('src/data/redevelopment.ts', output);
  console.log('\nSaved to src/data/redevelopment.ts');

  // 통계 출력
  const stats = {};
  results.forEach(p => {
    const stage = normalizeStage(p.stage);
    stats[stage] = (stats[stage] || 0) + 1;
  });
  console.log('\nStage distribution:');
  Object.entries(stats).sort((a, b) => b[1] - a[1]).forEach(([stage, count]) => {
    console.log(`  ${stage}: ${count}`);
  });
}

main();
