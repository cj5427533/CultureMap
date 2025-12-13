package com.culturemap.service;

import com.culturemap.domain.Member;
import com.culturemap.domain.PlanPost;
import com.culturemap.domain.Rating;
import com.culturemap.dto.RatingRequest;
import com.culturemap.dto.RatingResponse;
import com.culturemap.repository.MemberRepository;
import com.culturemap.repository.PlanPostRepository;
import com.culturemap.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class RatingService {

    private final RatingRepository ratingRepository;
    private final PlanPostRepository planPostRepository;
    private final MemberRepository memberRepository;

    public RatingResponse createOrUpdateRating(RatingRequest request, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        PlanPost post = planPostRepository.findById(request.getPostId())
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다"));

        Optional<Rating> existingRating = ratingRepository.findByPostIdAndMemberId(
                request.getPostId(), member.getId());

        Rating rating;
        if (existingRating.isPresent()) {
            rating = existingRating.get();
            rating.updateScore(request.getScore());
        } else {
            rating = Rating.builder()
                    .post(post)
                    .member(member)
                    .score(request.getScore())
                    .build();
        }

        ratingRepository.save(rating);
        updatePostRating(post);
        return toResponse(rating, member.getId());
    }

    @Transactional(readOnly = true)
    public RatingResponse getRating(Long postId, Authentication authentication) {
        final Long currentUserId;
        if (authentication != null) {
            String email = ((UserDetails) authentication.getPrincipal()).getUsername();
            currentUserId = memberRepository.findByEmail(email)
                    .map(member -> member.getId())
                    .orElse(null);
        } else {
            currentUserId = null;
        }

        PlanPost post = planPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다"));

        final Integer userRating;
        if (currentUserId != null) {
            userRating = ratingRepository.findByPostIdAndMemberId(postId, currentUserId)
                    .map(rating -> rating.getScore())
                    .orElse(null);
        } else {
            userRating = null;
        }

        return RatingResponse.builder()
                .postId(postId)
                .score(post.getAverageRating() != null ? post.getAverageRating().intValue() : 0)
                .userRating(userRating)
                .build();
    }

    public void deleteRating(Long postId, Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        Rating rating = ratingRepository.findByPostIdAndMemberId(postId, member.getId())
                .orElseThrow(() -> new IllegalArgumentException("별점을 찾을 수 없습니다"));

        ratingRepository.delete(rating);
        PlanPost post = planPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다"));
        updatePostRating(post);
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

    private RatingResponse toResponse(Rating rating, Long currentUserId) {
        return RatingResponse.builder()
                .id(rating.getId())
                .postId(rating.getPost().getId())
                .score(rating.getScore())
                .memberNickname(rating.getMember().getNickname())
                .createdAt(rating.getCreatedAt())
                .userRating(currentUserId != null && rating.getMember().getId().equals(currentUserId) 
                        ? rating.getScore() : null)
                .build();
    }
}
