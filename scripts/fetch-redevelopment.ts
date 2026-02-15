/**
 * 서울시 정비사업 정보몽땅에서 실제 재개발/재건축 데이터를 가져오는 스크립트
 */

const KAKAO_API_KEY = "dc5039a6428787151fa6afc2777aac06";

interface RawProject {
  num: string;
  district: string;
  type: string;
  name: string;
  address: string;
  stage: string;
}

interface GeocodedProject extends RawProject {
  lat: number;
  lng: number;
}

// 정비사업 정보몽땅에서 데이터 가져오기
async function fetchProjects(): Promise<RawProject[]> {
  const projects: RawProject[] = [];

  // 여러 페이지에서 데이터 가져오기
  for (let page = 1; page <= 6; page++) {
    const response = await fetch('https://cleanup.seoul.go.kr/cleanup/bsnssttus/lsubBsnsSttus.do', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `pageNo=${page}&pageSize=200`,
    });

    const html = await response.text();

    // HTML 파싱
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

    console.log(`Page ${page}: Found ${projects.length} projects so far`);
  }

  return projects;
}

// 카카오 API로 주소를 좌표로 변환
async function geocodeAddress(address: string, district: string): Promise<{ lat: number; lng: number } | null> {
  const fullAddress = `서울특별시 ${district} ${address}`;

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(fullAddress)}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_API_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      return {
        lat: parseFloat(data.documents[0].y),
        lng: parseFloat(data.documents[0].x),
      };
    }

    // 주소 검색 실패시 키워드 검색 시도
    const keywordResponse = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(fullAddress)}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_API_KEY}`,
        },
      }
    );

    const keywordData = await keywordResponse.json();

    if (keywordData.documents && keywordData.documents.length > 0) {
      return {
        lat: parseFloat(keywordData.documents[0].y),
        lng: parseFloat(keywordData.documents[0].x),
      };
    }

    return null;
  } catch (error) {
    console.error(`Geocoding error for ${fullAddress}:`, error);
    return null;
  }
}

// 단계명 정규화
function normalizeStage(stage: string): string {
  const stageMap: Record<string, string> = {
    '안전진단': '후보지',
    '정비계획 수립': '후보지',
    '추진주체구성전': '후보지',
    '정비구역지정': '정비구역지정',
    '추진위원회': '추진위승인',
    '추진위승인': '추진위승인',
    '조합설립인가': '조합설립',
    '조합설립': '조합설립',
    '사업시행인가': '사업시행인가',
    '관리처분인가': '관리처분인가',
    '착공': '착공',
    '준공인가': '준공',
    '준공': '준공',
    '이전고시': '준공',
    '조합해산': '준공',
    '조합청산': '준공',
  };

  return stageMap[stage] || '후보지';
}

// 중심점 주변에 폴리곤 생성 (사각형 근사)
function createPolygon(lat: number, lng: number, size: number = 0.002): [number, number][] {
  return [
    [lng - size, lat - size],
    [lng + size, lat - size],
    [lng + size, lat + size],
    [lng - size, lat + size],
    [lng - size, lat - size],
  ];
}

async function main() {
  console.log('Fetching redevelopment projects from 정비사업 정보몽땅...');

  const projects = await fetchProjects();
  console.log(`\nTotal projects found: ${projects.length}`);

  // 진행 중인 프로젝트만 필터링 (조합해산, 조합청산 제외)
  const activeProjects = projects.filter(p =>
    !['조합해산', '조합청산', '이전고시'].includes(p.stage)
  );

  console.log(`Active projects: ${activeProjects.length}`);

  // 샘플로 처음 100개만 좌표 변환 (API 제한 고려)
  const sampleProjects = activeProjects.slice(0, 100);

  console.log('\nGeocoding addresses...');

  const geocodedProjects: GeocodedProject[] = [];

  for (let i = 0; i < sampleProjects.length; i++) {
    const project = sampleProjects[i];
    const coords = await geocodeAddress(project.address, project.district);

    if (coords) {
      geocodedProjects.push({
        ...project,
        lat: coords.lat,
        lng: coords.lng,
      });
      console.log(`[${i + 1}/${sampleProjects.length}] ${project.name} -> (${coords.lat}, ${coords.lng})`);
    } else {
      console.log(`[${i + 1}/${sampleProjects.length}] ${project.name} -> FAILED`);
    }

    // API 레이트 리밋 방지
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\nSuccessfully geocoded: ${geocodedProjects.length} projects`);

  // TypeScript 코드 생성
  const output = `// 실제 서울시 정비사업 데이터 (정비사업 정보몽땅 기준)
// 생성일: ${new Date().toISOString().split('T')[0]}

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
${geocodedProjects.map((p, i) => `  {
    id: "zone-${i + 1}",
    name: "${p.name.replace(/"/g, '\\"')}",
    type: "${p.type === '재개발' ? '재개발' : '재건축'}",
    stage: "${normalizeStage(p.stage)}",
    district: "${p.district}",
    coordinates: ${JSON.stringify(createPolygon(p.lat, p.lng))},
  }`).join(',\n')}
];
`;

  console.log('\n--- Generated TypeScript Code ---\n');
  console.log(output);
}

main().catch(console.error);
