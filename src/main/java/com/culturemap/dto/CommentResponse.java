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
public class CommentResponse {
    private Long id;
    private Long postId;
    private String content;
    private Integer rating; // 별점 (1~5, 선택적)
    private String authorNickname;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isAuthor;
}
