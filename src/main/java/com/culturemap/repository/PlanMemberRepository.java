package com.culturemap.repository;

import com.culturemap.domain.PlanMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlanMemberRepository extends JpaRepository<PlanMember, Long> {
    
    List<PlanMember> findByPlanId(Long planId);
    
    @EntityGraph(attributePaths = {"plan", "plan.member", "plan.planPlaces", "plan.planPlaces.place"})
    @Query("SELECT pm FROM PlanMember pm WHERE pm.member.id = :memberId")
    List<PlanMember> findByMemberId(@Param("memberId") Long memberId);
    
    Optional<PlanMember> findByPlanIdAndMemberId(Long planId, Long memberId);
    boolean existsByPlanIdAndMemberId(Long planId, Long memberId);
    void deleteByPlanId(Long planId);
    void deleteByMemberId(Long memberId);
}
