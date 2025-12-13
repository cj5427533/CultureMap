package com.culturemap.repository;

import com.culturemap.domain.Member;
import com.culturemap.domain.Plan;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PlanRepository extends JpaRepository<Plan, Long> {
    
    @EntityGraph(attributePaths = {"member", "planPlaces", "planPlaces.place"})
    List<Plan> findByMember(Member member);
    
    @EntityGraph(attributePaths = {"member", "planPlaces", "planPlaces.place"})
    List<Plan> findByMemberAndPlanDate(Member member, LocalDate planDate);
    
    @EntityGraph(attributePaths = {"member", "planPlaces", "planPlaces.place"})
    @Query("SELECT p FROM Plan p WHERE p.id = :id")
    Optional<Plan> findByIdWithDetails(@Param("id") Long id);
}

