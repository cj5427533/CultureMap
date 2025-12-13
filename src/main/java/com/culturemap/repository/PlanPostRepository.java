package com.culturemap.repository;

import com.culturemap.domain.PlanPost;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PlanPostRepository extends JpaRepository<PlanPost, Long> {
    
    @EntityGraph(attributePaths = {"plan", "plan.member", "plan.planPlaces", "plan.planPlaces.place"})
    @Query("SELECT p FROM PlanPost p ORDER BY p.createdAt DESC")
    List<PlanPost> findAllByOrderByCreatedAtDesc();
    
    @EntityGraph(attributePaths = {"plan", "plan.member", "plan.planPlaces", "plan.planPlaces.place"})
    @Query("SELECT p FROM PlanPost p WHERE p.id = :id")
    Optional<PlanPost> findByIdWithDetails(Long id);
}

