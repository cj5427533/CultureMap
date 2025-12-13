package com.culturemap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectionsResponse {
    private double distanceMeters;
    private double durationSeconds;
    private List<DirectionsRequest.LatLng> path;
    private boolean fromCache;
    private String provider;
    private String transportMode;
}
