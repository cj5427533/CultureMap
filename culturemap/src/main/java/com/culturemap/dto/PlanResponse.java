package com.culturemap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanResponse {
    private Long id;
    private LocalDate planDate;
    private String title;
    private String memberNickname;
    private List<PlaceResponse> places;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

