package com.culturemap.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentRequest {
    @NotNull
    private Long postId;

    @NotBlank(message = "댓글 내용을 입력해주세요")
    private String content;

    @Min(1)
    @Max(5)
    private Integer rating; // 별점 (1~5, 선택적)
}
