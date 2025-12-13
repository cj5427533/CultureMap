package com.culturemap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingResponse {
    private Long id;
    private Long postId;
    private Integer score;
    private String memberNickname;
    private LocalDateTime createdAt;
    private Integer userRating; // 현재 사용자가 준 별점 (null 가능)
}
