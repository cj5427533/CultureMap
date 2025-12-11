package com.culturemap.repository;

import com.culturemap.domain.Member;
import com.culturemap.domain.Plan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PlanRepository extends JpaRepository<Plan, Long> {
    List<Plan> findByMember(Member member);
    List<Plan> findByMemberAndPlanDate(Member member, LocalDate planDate);
}

