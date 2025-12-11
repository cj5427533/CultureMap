package com.culturemap.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AddPlaceToPlanRequest {
    @NotNull(message = "날짜는 필수입니다")
    private LocalDate planDate;

    @NotNull(message = "장소 ID는 필수입니다")
    private Long placeId;

    private LocalTime visitTime;

    private String title; // 새 플랜 생성 시 사용
}

