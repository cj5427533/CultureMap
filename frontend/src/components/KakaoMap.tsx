import { useEffect, useRef } from 'react';
import type { Place } from '../types/index';

interface RoutePoint {
  lat: number;
  lng: number;
}

interface KakaoMapProps {
  places: Place[];
  center?: { lat: number; lng: number };
  height?: string;
  routePath?: RoutePoint[];
}

// Kakao Maps 타입은 types/kakao.d.ts에서 정의됨

export const KakaoMap = ({ places, center, height = '400px', routePath }: KakaoMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Window['kakao']['maps']['Map'] | null>(null);
  const markersRef = useRef<Window['kakao']['maps']['Marker'][]>([]);
  const polylineRef = useRef<Window['kakao']['maps']['Polyline'] | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        console.error('Kakao Maps SDK가 로드되지 않았습니다.');
        return;
      }

      // 기존 마커/경로 제거
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }

      // 기존 지도가 있으면 제거하지 않고 마커만 업데이트
      if (mapInstanceRef.current) {
        // 마커만 업데이트
        if (places && places.length > 0) {
          const bounds = new window.kakao.maps.LatLngBounds();

          places.forEach((place, index) => {
            if (place.latitude && place.longitude) {
              const position = new window.kakao.maps.LatLng(
                Number(place.latitude),
                Number(place.longitude)
              );

              // 커스텀 마커 이미지 생성 (초록색 원에 번호)
              const markerNumber = index + 1;
              const markerSize = new window.kakao.maps.Size(40, 40);
              const markerOffset = new window.kakao.maps.Point(20, 20);
              
              // SVG를 사용한 커스텀 마커
              const markerImageSrc = `data:image/svg+xml;base64,${btoa(`
                <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
                  <text x="20" y="26" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${markerNumber}</text>
                </svg>
              `)}`;
              
              const markerImage = new window.kakao.maps.MarkerImage(
                markerImageSrc,
                markerSize,
                { offset: markerOffset }
              );

              const marker = new window.kakao.maps.Marker({
                position: position,
                image: markerImage,
                map: mapInstanceRef.current,
              });

              const infoWindow = new window.kakao.maps.InfoWindow({
                content: `<div style="padding:5px;font-size:12px;">${markerNumber}. ${place.name}</div>`,
              });

              window.kakao.maps.event.addListener(marker, 'click', () => {
                infoWindow.open(mapInstanceRef.current, marker);
              });

              markersRef.current.push(marker);
              bounds.extend(position);
            }
          });

          if (places.length > 1) {
            mapInstanceRef.current.setBounds(bounds);
          } else if (places.length === 1 && places[0].latitude && places[0].longitude) {
            mapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(
              Number(places[0].latitude),
              Number(places[0].longitude)
            ));
            mapInstanceRef.current.setLevel(3);
          }

          // 경로 선 렌더링
          if (routePath && routePath.length > 1) {
            const path = routePath.map(p => new window.kakao.maps.LatLng(p.lat, p.lng));
            polylineRef.current = new window.kakao.maps.Polyline({
              path,
              strokeWeight: 5,
              strokeColor: '#22c55e',
              strokeOpacity: 0.8,
              strokeStyle: 'solid',
              map: mapInstanceRef.current,
            });
            const boundsWithRoute = new window.kakao.maps.LatLngBounds();
            path.forEach(latlng => boundsWithRoute.extend(latlng));
            mapInstanceRef.current.setBounds(boundsWithRoute);
          }
        }
        return;
      }

      // 새 지도 생성
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const defaultCenter = new window.kakao.maps.LatLng(37.5665, 126.9780);
        const mapCenter = center 
          ? new window.kakao.maps.LatLng(center.lat, center.lng)
          : defaultCenter;

        const mapOption = {
          center: mapCenter,
          level: 5,
        };

        const map = new window.kakao.maps.Map(mapRef.current, mapOption);
        mapInstanceRef.current = map;

        // 장소 마커 추가
        if (places && places.length > 0) {
          const bounds = new window.kakao.maps.LatLngBounds();

          places.forEach((place, index) => {
            if (place.latitude && place.longitude) {
              const position = new window.kakao.maps.LatLng(
                Number(place.latitude),
                Number(place.longitude)
              );

              // 커스텀 마커 이미지 생성 (초록색 원에 번호)
              const markerNumber = index + 1;
              const markerSize = new window.kakao.maps.Size(40, 40);
              const markerOffset = new window.kakao.maps.Point(20, 20);
              
              // SVG를 사용한 커스텀 마커
              const markerImageSrc = `data:image/svg+xml;base64,${btoa(`
                <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
                  <text x="20" y="26" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${markerNumber}</text>
                </svg>
              `)}`;
              
              const markerImage = new window.kakao.maps.MarkerImage(
                markerImageSrc,
                markerSize,
                { offset: markerOffset }
              );

              const marker = new window.kakao.maps.Marker({
                position: position,
                image: markerImage,
                map: map,
              });

              const infoWindow = new window.kakao.maps.InfoWindow({
                content: `<div style="padding:5px;font-size:12px;">${markerNumber}. ${place.name}</div>`,
              });

              window.kakao.maps.event.addListener(marker, 'click', () => {
                infoWindow.open(map, marker);
              });

              markersRef.current.push(marker);
              bounds.extend(position);
            }
          });

          if (places.length > 1) {
            map.setBounds(bounds);
          } else if (places.length === 1 && places[0].latitude && places[0].longitude) {
            map.setCenter(new window.kakao.maps.LatLng(
              Number(places[0].latitude),
              Number(places[0].longitude)
            ));
            map.setLevel(3);
          }

          if (routePath && routePath.length > 1) {
            const path = routePath.map(p => new window.kakao.maps.LatLng(p.lat, p.lng));
            polylineRef.current = new window.kakao.maps.Polyline({
              path,
              strokeWeight: 5,
              strokeColor: '#22c55e',
              strokeOpacity: 0.8,
              strokeStyle: 'solid',
              map,
            });
            const boundsWithRoute = new window.kakao.maps.LatLngBounds();
            path.forEach(latlng => boundsWithRoute.extend(latlng));
            map.setBounds(boundsWithRoute);
          }
        }
      });
    };

    // SDK가 이미 로드되어 있는지 확인
    if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
      initializeMap();
      return;
    }

    // SDK 로드
    const existingScript = document.querySelector('script[src*="dapi.kakao.com/v2/maps/sdk.js"]');
    if (existingScript) {
      // 이미 스크립트가 있으면 로드 완료를 기다림
      const checkSDK = setInterval(() => {
        if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
          clearInterval(checkSDK);
          initializeMap();
        }
      }, 100);

      return () => clearInterval(checkSDK);
    }

    // 새 스크립트 추가
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_API_KEY}&libraries=services,geometry`;
    script.onload = () => {
      initializeMap();
    };
    script.onerror = () => {
      console.error('Kakao Maps SDK 로드 실패');
    };
    document.head.appendChild(script);

    return () => {
      // cleanup은 하지 않음 (다른 컴포넌트에서도 사용할 수 있음)
    };
  }, [places, center, routePath]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: height,
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
};

