package com.culturemap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsResponse {
    private long totalUsers;
    private long totalPlans;
    private long totalPosts;
    private long totalComments;
    private long totalRatings;
    private ApiUsageStats apiUsage;
    
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApiUsageStats {
        private long directionsApiCallsToday;
        private long directionsApiCallsThisMonth;
        private long searchApiCallsToday;
        private long searchApiCallsThisMonth;
    }
}
