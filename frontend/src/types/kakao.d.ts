// Kakao Maps API 타입 정의
declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        LatLngBounds: new () => KakaoLatLngBounds;
        Size: new (width: number, height: number) => KakaoSize;
        Point: new (x: number, y: number) => KakaoPoint;
        Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
        MarkerImage: new (src: string, size: KakaoSize, options?: { offset?: KakaoPoint }) => KakaoMarkerImage;
        InfoWindow: new (options: { content: string }) => KakaoInfoWindow;
        Polyline: new (options: KakaoPolylineOptions) => KakaoPolyline;
        event: {
          addListener: (target: unknown, type: string, handler: () => void) => void;
        };
      };
    };
  }
}

interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
}

interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void;
  setLevel: (level: number) => void;
  setBounds: (bounds: KakaoLatLngBounds) => void;
}

interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

interface KakaoLatLngBounds {
  extend: (latlng: KakaoLatLng) => void;
}

interface KakaoSize {
  width: number;
  height: number;
}

interface KakaoPoint {
  x: number;
  y: number;
}

interface KakaoMarkerOptions {
  position: KakaoLatLng;
  image?: KakaoMarkerImage;
  map: KakaoMap;
}

interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface KakaoMarkerImage {
  // MarkerImage 타입은 Kakao Maps SDK에서 제공하는 타입
}

interface KakaoInfoWindow {
  open: (map: KakaoMap, marker: KakaoMarker) => void;
}

interface KakaoPolylineOptions {
  path: KakaoLatLng[];
  strokeWeight: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeStyle: string;
  map: KakaoMap;
}

interface KakaoPolyline {
  setMap: (map: KakaoMap | null) => void;
}

export {};
