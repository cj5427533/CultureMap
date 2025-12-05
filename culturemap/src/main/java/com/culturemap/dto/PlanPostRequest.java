package com.culturemap.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PlanPostRequest {
    @NotNull(message = "플랜 ID는 필수입니다")
    private Long planId;

    @NotBlank(message = "제목은 필수입니다")
    private String title;

    private String description;
}

