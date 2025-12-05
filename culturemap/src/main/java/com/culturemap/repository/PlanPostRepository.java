package com.culturemap.repository;

import com.culturemap.domain.PlanPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanPostRepository extends JpaRepository<PlanPost, Long> {
    List<PlanPost> findAllByOrderByCreatedAtDesc();
}

