package com.culturemap.service;

import com.culturemap.domain.Comment;
import com.culturemap.domain.Member;
import com.culturemap.domain.PlanPost;
import com.culturemap.domain.Rating;
import com.culturemap.dto.CommentRequest;
import com.culturemap.dto.CommentResponse;
import com.culturemap.repository.CommentRepository;
import com.culturemap.repository.MemberRepository;
import com.culturemap.repository.PlanPostRepository;
import com.culturemap.repository.RatingRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final PlanPostRepository planPostRepository;
    private final MemberRepository memberRepository;
    private final RatingRepository ratingRepository;

    public CommentResponse createComment(CommentRequest request, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        PlanPost post = planPostRepository.findById(request.getPostId())
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다"));

        Comment comment = Comment.builder()
                .post(post)
                .member(member)
                .content(request.getContent())
                .rating(request.getRating())
                .build();

        commentRepository.save(comment);

        // 별점이 있으면 Rating도 생성/업데이트
        if (request.getRating() != null && request.getRating() >= 1 && request.getRating() <= 5) {
            ratingRepository.findByPostIdAndMemberId(request.getPostId(), member.getId())
                    .ifPresentOrElse(
                            existingRating -> {
                                existingRating.updateScore(request.getRating());
                                ratingRepository.save(existingRating);
                            },
                            () -> {
                                Rating rating = Rating.builder()
                                        .post(post)
                                        .member(member)
                                        .score(request.getRating())
                                        .build();
                                ratingRepository.save(rating);
                            }
                    );
            // 게시글 평균 별점 업데이트
            updatePostRating(post);
        }

        return toResponse(comment, member.getId());
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long postId, Authentication authentication) {
        Long currentUserId = null;
        if (authentication != null) {
            String email = ((UserDetails) authentication.getPrincipal()).getUsername();
            currentUserId = memberRepository.findByEmail(email)
                    .map(member -> member.getId())
                    .orElse(null);
        }

        final Long userId = currentUserId;
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId).stream()
                .map(comment -> toResponse(comment, userId))
                .collect(Collectors.toList());
    }

    public CommentResponse updateComment(Long commentId, CommentRequest request, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다"));

        if (!comment.getMember().getId().equals(member.getId())) {
            throw new IllegalArgumentException("권한이 없습니다");
        }

        comment.updateContent(request.getContent());
        commentRepository.save(comment);
        return toResponse(comment, member.getId());
    }

    public void deleteComment(Long commentId, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다"));

        boolean isAuthor = comment.getMember().getId().equals(member.getId());
        boolean isAdmin = member.getRole() != null && member.getRole().equals("ADMIN");

        if (!isAuthor && !isAdmin) {
            throw new IllegalArgumentException("권한이 없습니다");
        }

        commentRepository.delete(comment);
    }

    private void updatePostRating(PlanPost post) {
        List<Rating> ratings = ratingRepository.findByPostId(post.getId());
        if (ratings.isEmpty()) {
            post.updateRating(null, 0);
        } else {
            double average = ratings.stream()
                    .mapToInt(Rating::getScore)
                    .average()
                    .orElse(0.0);
            post.updateRating(Math.round(average * 10.0) / 10.0, ratings.size());
        }
        planPostRepository.save(post);
    }

    private CommentResponse toResponse(Comment comment, Long currentUserId) {
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .content(comment.getContent())
                .rating(comment.getRating())
                .authorNickname(comment.getMember().getNickname())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .isAuthor(currentUserId != null && comment.getMember().getId().equals(currentUserId))
                .build();
    }
}
