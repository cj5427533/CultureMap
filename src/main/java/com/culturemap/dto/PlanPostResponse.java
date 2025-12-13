package com.culturemap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanPostResponse {
    private Long id;
    private Long planId;
    private String title;
    private String description;
    private String authorNickname;
    private Double averageRating;
    private Integer ratingCount;
    private PlanResponse plan;
    private LocalDateTime createdAt;
}

