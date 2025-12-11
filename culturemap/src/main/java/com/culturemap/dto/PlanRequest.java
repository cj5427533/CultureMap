package com.culturemap.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlanRequest {
    @NotNull(message = "날짜는 필수입니다")
    private LocalDate planDate;

    private String title;

    @NotNull(message = "장소 목록은 필수입니다")
    private List<Long> placeIds;

    // 장소 ID와 방문 시간 매핑 (선택사항)
    // JSON에서는 String 키로 받고, 서비스에서 Long으로 변환
    @JsonFormat(pattern = "HH:mm")
    private Map<String, String> visitTimes;
}

