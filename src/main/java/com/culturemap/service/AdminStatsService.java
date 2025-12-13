package com.culturemap.service;

import com.culturemap.dto.AdminStatsResponse;
import com.culturemap.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminStatsService {

    private final MemberRepository memberRepository;
    private final PlanRepository planRepository;
    private final PlanPostRepository planPostRepository;
    private final CommentRepository commentRepository;
    private final RatingRepository ratingRepository;
    private final DirectionsService directionsService;
    private final ExternalApiService externalApiService;

    public AdminStatsResponse getStats() {
        try {
            long totalUsers = memberRepository.count();
            long totalPlans = planRepository.count();
            long totalPosts = planPostRepository.count();
            long totalComments = commentRepository.count();
            long totalRatings = ratingRepository.count();

            // API 사용량 통계 (안전하게 호출)
            long directionsToday = 0;
            long directionsTotal = 0;
            long searchToday = 0;
            long searchTotal = 0;
            
            try {
                directionsToday = directionsService.getTodayCalls();
                directionsTotal = directionsService.getTotalCalls();
            } catch (Exception e) {
                log.warn("Directions API 통계 조회 실패", e);
            }
            
            try {
                searchToday = externalApiService.getTodaySearchCalls();
                searchTotal = externalApiService.getTotalSearchCalls();
            } catch (Exception e) {
                log.warn("Search API 통계 조회 실패", e);
            }

            AdminStatsResponse.ApiUsageStats apiUsage = AdminStatsResponse.ApiUsageStats.builder()
                    .directionsApiCallsToday(directionsToday)
                    .directionsApiCallsThisMonth(directionsTotal)
                    .searchApiCallsToday(searchToday)
                    .searchApiCallsThisMonth(searchTotal)
                    .build();

            return AdminStatsResponse.builder()
                    .totalUsers(totalUsers)
                    .totalPlans(totalPlans)
                    .totalPosts(totalPosts)
                    .totalComments(totalComments)
                    .totalRatings(totalRatings)
                    .apiUsage(apiUsage)
                    .build();
        } catch (Exception e) {
            log.error("통계 조회 중 오류 발생", e);
            throw new RuntimeException("통계를 불러오는데 실패했습니다: " + e.getMessage(), e);
        }
    }

}
