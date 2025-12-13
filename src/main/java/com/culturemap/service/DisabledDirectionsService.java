package com.culturemap.service;

import com.culturemap.dto.DirectionsRequest;
import com.culturemap.dto.DirectionsResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

/**
 * Kakao API 키가 없을 때 사용되는 대체 DirectionsService 구현
 * 모든 메서드가 기능 비활성화 메시지를 반환합니다.
 */
@Service
@ConditionalOnMissingBean(DirectionsService.class)
@Slf4j
public class DisabledDirectionsService {

    public DirectionsResponse getCarDirections(DirectionsRequest request) {
        log.warn("DirectionsService가 비활성화되어 있습니다. KAKAO_REST_API_KEY 환경변수를 설정해주세요.");
        throw new ResponseStatusException(
            SERVICE_UNAVAILABLE,
            "경로 조회 기능이 현재 사용할 수 없습니다. Kakao API 키가 설정되지 않았습니다."
        );
    }

    public int getTodayCalls() {
        return 0;
    }

    public int getTotalCalls() {
        return 0;
    }
}
