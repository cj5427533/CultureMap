package com.culturemap.service;

import com.culturemap.domain.Place;
import com.culturemap.dto.PlaceRequest;
import com.culturemap.dto.PlaceResponse;
import com.culturemap.repository.PlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final CacheService cacheService;

    @Transactional(readOnly = true)
    public List<PlaceResponse> searchPlaces(String keyword, Long userId) {
        // 캐시 확인 (키워드가 있고 사용자가 로그인한 경우)
        if (keyword != null && !keyword.isEmpty() && userId != null) {
            Optional<List<Map<String, Object>>> cached = cacheService.getCachedSearchResult(userId, keyword);
            if (cached.isPresent()) {
                log.debug("검색 결과 캐시 히트: keyword={}, userId={}", keyword, userId);
                return cached.get().stream()
                        .map(this::mapToPlaceResponse)
                        .collect(Collectors.toList());
            }
        }

        List<Place> places;
        if (keyword != null && !keyword.isEmpty()) {
            // 키워드가 있으면 이름 또는 주소에서 검색
            places = placeRepository.findAll().stream()
                    .filter(p -> p.getName().contains(keyword) ||
                               (p.getAddress() != null && p.getAddress().contains(keyword)))
                    .collect(Collectors.toList());
            
            // 최근 검색에 추가
            if (userId != null) {
                cacheService.addRecentSearch(userId, keyword);
            }
        } else {
            // 키워드가 없으면 전체 조회
            places = placeRepository.findAll();
        }

        List<PlaceResponse> responses = places.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        // 캐시 저장 (키워드가 있고 사용자가 로그인한 경우)
        if (keyword != null && !keyword.isEmpty() && userId != null) {
            List<Map<String, Object>> cacheData = responses.stream()
                    .map(this::placeResponseToMap)
                    .collect(Collectors.toList());
            cacheService.cacheSearchResult(userId, keyword, cacheData);
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public PlaceResponse getPlace(Long id) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("장소를 찾을 수 없습니다"));

        return toResponse(place);
    }

    /**
     * 새로운 장소 생성 (카카오 API에서 가져온 장소를 DB에 저장)
     * externalId가 있으면 중복 체크를 수행하고, 이미 존재하는 경우 기존 장소를 반환
     */
    public PlaceResponse createPlace(PlaceRequest request) {
        // externalId로 중복 체크
        if (request.getExternalId() != null && !request.getExternalId().isEmpty()) {
            Place existingPlace = placeRepository.findByExternalId(request.getExternalId()).orElse(null);
            
            // 이미 존재하는 경우 기존 장소 반환
            if (existingPlace != null) {
                return toResponse(existingPlace);
            }
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

        return toResponse(place);
    }

    /**
     * 인기 장소 조회 (캐시 우선)
     */
    @Transactional(readOnly = true)
    public List<PlaceResponse> getPopularPlaces() {
        Optional<List<Map<String, Object>>> cached = cacheService.getCachedPopularPlaces();
        if (cached.isPresent()) {
            log.debug("인기 장소 캐시 히트");
            return cached.get().stream()
                    .map(this::mapToPlaceResponse)
                    .collect(Collectors.toList());
        }

        // 실제로는 조회수나 평점 기반으로 인기 장소를 계산해야 하지만,
        // 여기서는 최근에 많이 검색된 장소나 플랜에 많이 추가된 장소를 반환
        List<Place> places = placeRepository.findAll();
        
        // 간단히 전체 장소를 반환 (실제로는 통계 기반으로 정렬 필요)
        List<PlaceResponse> responses = places.stream()
                .map(this::toResponse)
                .limit(10) // 상위 10개만
                .collect(Collectors.toList());

        // 캐시 저장
        List<Map<String, Object>> cacheData = responses.stream()
                .map(this::placeResponseToMap)
                .collect(Collectors.toList());
        cacheService.cachePopularPlaces(cacheData);

        return responses;
    }

    /**
     * Place Entity를 PlaceResponse DTO로 변환
     */
    private PlaceResponse toResponse(Place place) {
        return PlaceResponse.builder()
                .id(place.getId())
                .name(place.getName())
                .address(place.getAddress())
                .category(place.getCategory())
                .latitude(place.getLatitude())
                .longitude(place.getLongitude())
                .description(place.getDescription())
                .build();
    }

    private Map<String, Object> placeResponseToMap(PlaceResponse response) {
        return Map.of(
            "id", response.getId(),
            "name", response.getName() != null ? response.getName() : "",
            "address", response.getAddress() != null ? response.getAddress() : "",
            "category", response.getCategory() != null ? response.getCategory() : "",
            "latitude", response.getLatitude() != null ? response.getLatitude() : java.math.BigDecimal.ZERO,
            "longitude", response.getLongitude() != null ? response.getLongitude() : java.math.BigDecimal.ZERO,
            "description", response.getDescription() != null ? response.getDescription() : ""
        );
    }

    @SuppressWarnings("unchecked")
    private PlaceResponse mapToPlaceResponse(Map<String, Object> map) {
        return PlaceResponse.builder()
                .id(((Number) map.get("id")).longValue())
                .name((String) map.get("name"))
                .address((String) map.get("address"))
                .category((String) map.get("category"))
                .latitude(map.get("latitude") instanceof Number 
                    ? java.math.BigDecimal.valueOf(((Number) map.get("latitude")).doubleValue())
                    : null)
                .longitude(map.get("longitude") instanceof Number
                    ? java.math.BigDecimal.valueOf(((Number) map.get("longitude")).doubleValue())
                    : null)
                .description((String) map.get("description"))
                .build();
    }
}
