# SubwayFinder (지하철역 거리 계산기)

지도에서 클릭한 위치 주변의 가장 가까운 지하철역을 찾고, 도보 경로와 거리를 보여주는 웹/모바일 앱입니다.
서울의 경우 재개발·재건축 정보도 함께 제공합니다.

> **Live Demo**: [https://geo-realestate.vercel.app](https://geo-realestate.vercel.app)

## Features

- **6개 도시 지하철 탐색** — 서울, 도쿄, 뉴욕, 런던, 파리, 베이징
- **가까운 역 찾기** — 지도 클릭 시 가장 가까운 5개 역을 거리순으로 표시
- **도보 경로** — OSRM 기반 실제 도로를 따르는 도보 경로 및 소요시간 표시
- **장소 검색** — 서울은 Kakao Maps API, 그 외 도시는 Nominatim 사용
- **현재 위치** — GPS로 현재 위치 탐색
- **2D/3D 지도 전환** — Leaflet(2D) / Deck.gl(3D) 뷰 전환
- **재개발 정보 (서울)** — 재개발·재건축 구역을 단계별 색상으로 시각화
- **모바일 앱** — Capacitor를 통한 iOS/Android 네이티브 앱 지원

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React 19, TypeScript, Vite |
| 2D Map | Leaflet, React-Leaflet |
| 3D Map | Deck.gl, MapLibre GL, React-Map-GL |
| Routing | OSRM (OpenStreetMap Routing Machine) |
| Search | Kakao Maps API (Seoul), Nominatim (Others) |
| Mobile | Capacitor (iOS, Android) |
| Deploy | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/HongwooKim/subwayfinder.git
cd subwayfinder
npm install
```

### Environment Variables

`.env.local` 파일을 생성하고 API 키를 설정합니다.

```bash
cp .env.example .env.local
```

```env
VITE_KAKAO_API_KEY=your_kakao_rest_api_key_here
VITE_SEOUL_API_KEY=your_seoul_opendata_api_key_here
```

API 키 발급처:
- **Kakao REST API Key**: [Kakao Developers](https://developers.kakao.com/)
- **서울시 공공데이터 API Key**: [서울 열린데이터광장](https://data.seoul.go.kr/)

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Mobile (Capacitor)

```bash
# iOS
npm run cap:ios

# Android
npm run cap:android
```

## Project Structure

```
src/
├── components/
│   ├── Map.tsx                  # 2D Leaflet 지도
│   ├── Map3D.tsx                # 3D Deck.gl 지도
│   ├── SearchBar.tsx            # 장소 검색
│   ├── StationList.tsx          # 주변 역 목록
│   ├── ControlPanel.tsx         # 지도 컨트롤 패널
│   └── CurrentLocationButton.tsx # 현재 위치 버튼
├── hooks/
│   ├── useCurrentLocation.ts    # GPS 위치 훅
│   └── useWalkingRoutes.ts      # OSRM 도보 경로 훅
├── data/
│   ├── cities.ts                # 도시 설정
│   ├── redevelopment.ts         # 서울 재개발 구역 데이터
│   └── stations/                # 도시별 지하철역 데이터
├── utils/
│   ├── distance.ts              # Haversine 거리 계산
│   └── routing.ts               # OSRM 라우팅
├── App.tsx
└── App.css
```

## Supported Cities

| City | Stations | Search | Redevelopment Data |
|------|----------|--------|--------------------|
| Seoul | 500+ | Kakao Maps API | Yes |
| Tokyo | Full network | Nominatim | - |
| New York | Full network | Nominatim | - |
| London | Full network | Nominatim | - |
| Paris | Full network | Nominatim | - |
| Beijing | Full network | Nominatim | - |

## License

MIT
