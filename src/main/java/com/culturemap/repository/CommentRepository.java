package com.culturemap.repository;

import com.culturemap.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdOrderByCreatedAtDesc(Long postId);
    void deleteByPostId(Long postId);
    void deleteByMemberId(Long memberId);
}
