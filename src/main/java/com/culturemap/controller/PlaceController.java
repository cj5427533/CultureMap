package com.culturemap.controller;

import com.culturemap.domain.Place;
import com.culturemap.dto.PlaceRequest;
import com.culturemap.dto.PlaceResponse;
import com.culturemap.repository.PlaceRepository;
import com.culturemap.service.ExternalApiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
public class PlaceController {

    private final PlaceRepository placeRepository;
    private final ExternalApiService externalApiService;

    @GetMapping
    public ResponseEntity<List<PlaceResponse>> searchPlaces(@RequestParam(required = false) String keyword) {
        List<Place> places;
        if (keyword != null && !keyword.isEmpty()) {
            places = placeRepository.findAll().stream()
                    .filter(p -> p.getName().contains(keyword) || 
                               (p.getAddress() != null && p.getAddress().contains(keyword)))
                    .collect(Collectors.toList());
        } else {
            places = placeRepository.findAll();
        }

        List<PlaceResponse> responses = places.stream()
                .map(p -> PlaceResponse.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .address(p.getAddress())
                        .category(p.getCategory())
                        .latitude(p.getLatitude())
                        .longitude(p.getLongitude())
                        .description(p.getDescription())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaceResponse> getPlace(@PathVariable Long id) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("장소를 찾을 수 없습니다"));

        PlaceResponse response = PlaceResponse.builder()
                .id(place.getId())
                .name(place.getName())
                .address(place.getAddress())
                .category(place.getCategory())
                .latitude(place.getLatitude())
                .longitude(place.getLongitude())
                .description(place.getDescription())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * 새로운 장소 생성 (카카오 API에서 가져온 장소를 DB에 저장)
     */
    @PostMapping
    public ResponseEntity<PlaceResponse> createPlace(@RequestBody PlaceRequest request) {
        // externalId로 중복 체크
        Place existingPlace = null;
        if (request.getExternalId() != null && !request.getExternalId().isEmpty()) {
            existingPlace = placeRepository.findByExternalId(request.getExternalId()).orElse(null);
        }
        
        // 이미 존재하는 경우 기존 장소 반환
        if (existingPlace != null) {
            PlaceResponse response = PlaceResponse.builder()
                    .id(existingPlace.getId())
                    .name(existingPlace.getName())
                    .address(existingPlace.getAddress())
                    .category(existingPlace.getCategory())
                    .latitude(existingPlace.getLatitude())
                    .longitude(existingPlace.getLongitude())
                    .description(existingPlace.getDescription())
                    .build();
            return ResponseEntity.ok(response);
        }
        
        // 새 장소 생성
        Place place = Place.builder()
                .name(request.getName())
                .address(request.getAddress())
                .category(request.getCategory())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .description(request.getDescription())
                .externalId(request.getExternalId())
                .build();
        
        place = placeRepository.save(place);
        
        PlaceResponse response = PlaceResponse.builder()
                .id(place.getId())
                .name(place.getName())
                .address(place.getAddress())
                .category(place.getCategory())
                .latitude(place.getLatitude())
                .longitude(place.getLongitude())
                .description(place.getDescription())
                .build();
        
        return ResponseEntity.ok(response);
    }

    /**
     * Kakao Local API를 통한 주변 문화시설 검색 (프록시)
     * @param lng 경도
     * @param lat 위도
     * @param radius 반경 (미터, 기본 2000m)
     * @return Kakao API 응답 JSON
     */
    @GetMapping("/kakao/nearby")
    public ResponseEntity<String> searchNearbyCulturePlaces(
            @RequestParam double lng,
            @RequestParam double lat,
            @RequestParam(defaultValue = "2000") int radius) {
        String response = externalApiService.searchNearbyCulturePlaces(lng, lat, radius);
        return ResponseEntity.ok(response);
    }
}

