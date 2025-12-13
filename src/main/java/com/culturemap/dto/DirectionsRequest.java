package com.culturemap.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectionsRequest {

    @NotNull
    private Double originLat;

    @NotNull
    private Double originLng;

    @NotNull
    private Double destLat;

    @NotNull
    private Double destLng;

    /**
     * 선택: 중간 경유지(위도/경도)
     */
    private List<LatLng> waypoints;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LatLng {
        private Double lat;
        private Double lng;
    }
}
