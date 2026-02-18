# SubwayFinder (지하철역 거리 계산기)

Find the nearest subway stations from any location on the map, with walking routes and distances. Includes redevelopment project data for Seoul.

> **Live Demo**: [https://subwayfinder.vercel.app](https://subwayfinder.vercel.app)

## Features

- **6 cities supported** — Seoul, Tokyo, New York, London, Paris, Beijing
- **Nearest stations** — Click anywhere on the map to find the 5 closest stations sorted by distance
- **Walking routes** — Real road-based walking routes and estimated time via OSRM
- **Address search** — Kakao Maps API for Seoul, Nominatim for other cities
- **Current location** — GPS-based location detection
- **2D/3D map toggle** — Switch between Leaflet (2D) and Deck.gl (3D) views
- **Redevelopment info (Seoul)** — Visualize redevelopment/reconstruction zones by stage
- **Mobile apps** — iOS/Android native apps via Capacitor

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

Create a `.env.local` file with your API keys:

```bash
cp .env.example .env.local
```

```env
VITE_KAKAO_API_KEY=your_kakao_rest_api_key_here
VITE_SEOUL_API_KEY=your_seoul_opendata_api_key_here
```

Where to get API keys:
- **Kakao REST API Key**: [Kakao Developers](https://developers.kakao.com/)
- **Seoul Open Data API Key**: [Seoul Open Data Plaza](https://data.seoul.go.kr/)

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
│   ├── Map.tsx                  # 2D Leaflet map
│   ├── Map3D.tsx                # 3D Deck.gl map
│   ├── SearchBar.tsx            # Address search
│   ├── StationList.tsx          # Nearby station list
│   ├── ControlPanel.tsx         # Map control panel
│   └── CurrentLocationButton.tsx # Current location button
├── hooks/
│   ├── useCurrentLocation.ts    # GPS location hook
│   └── useWalkingRoutes.ts      # OSRM walking route hook
├── data/
│   ├── cities.ts                # City configuration
│   ├── redevelopment.ts         # Seoul redevelopment zone data
│   └── stations/                # Subway station data by city
├── utils/
│   ├── distance.ts              # Haversine distance calculation
│   └── routing.ts               # OSRM routing
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

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT
