const KAKAO_API_KEY = "dc5039a6428787151fa6afc2777aac06";

// 정비사업 정보몽땅에서 데이터 가져오기
async function fetchProjects() {
  const projects = [];
  
  const response = await fetch('https://cleanup.seoul.go.kr/cleanup/bsnssttus/lsubBsnsSttus.do', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'pageNo=1&pageSize=200',
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

// 카카오 API로 좌표 변환
async function geocode(address, district) {
  const fullAddress = "서울특별시 " + district + " " + address;
  
  const response = await fetch(
    "https://dapi.kakao.com/v2/local/search/address.json?query=" + encodeURIComponent(fullAddress),
    { headers: { Authorization: "KakaoAK " + KAKAO_API_KEY } }
  );
  
  const data = await response.json();
  
  if (data.documents && data.documents.length > 0) {
    return { lat: parseFloat(data.documents[0].y), lng: parseFloat(data.documents[0].x) };
  }
  
  // 키워드 검색 시도
  const kwResponse = await fetch(
    "https://dapi.kakao.com/v2/local/search/keyword.json?query=" + encodeURIComponent(fullAddress),
    { headers: { Authorization: "KakaoAK " + KAKAO_API_KEY } }
  );
  
  const kwData = await kwResponse.json();
  
  if (kwData.documents && kwData.documents.length > 0) {
    return { lat: parseFloat(kwData.documents[0].y), lng: parseFloat(kwData.documents[0].x) };
  }
  
  return null;
}

async function main() {
  console.log('Fetching projects...');
  const projects = await fetchProjects();
  console.log('Total:', projects.length);
  
  // 진행 중인 프로젝트만
  const active = projects.filter(p => !['조합해산', '조합청산', '이전고시'].includes(p.stage));
  console.log('Active:', active.length);
  
  // 처음 50개만 좌표 변환
  const results = [];
  const sample = active.slice(0, 50);
  
  for (let i = 0; i < sample.length; i++) {
    const p = sample[i];
    const coords = await geocode(p.address, p.district);
    if (coords) {
      results.push({ ...p, ...coords });
      console.log('[' + (i+1) + '] ' + p.name.substring(0, 20) + ' -> OK');
    } else {
      console.log('[' + (i+1) + '] ' + p.name.substring(0, 20) + ' -> FAIL');
    }
    await new Promise(r => setTimeout(r, 50));
  }
  
  console.log('\nGeocoded:', results.length);
  console.log(JSON.stringify(results, null, 2));
}

main();
