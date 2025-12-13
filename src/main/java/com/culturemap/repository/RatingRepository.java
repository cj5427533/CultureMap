package com.culturemap.repository;

import com.culturemap.domain.Rating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByPostIdAndMemberId(Long postId, Long memberId);
    List<Rating> findByPostId(Long postId);
}
