package com.culturemap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoryResponse {
    private Long id;
    private String imageUrl;
    private LocalDate eventDate;
    private String location;
    private Integer displayOrder;
    private LocalDateTime createdAt;
}
