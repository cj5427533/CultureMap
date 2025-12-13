package com.culturemap.repository;

import com.culturemap.domain.History;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoryRepository extends JpaRepository<History, Long> {
    List<History> findByMemberIdOrderByDisplayOrderAsc(Long memberId);
    void deleteByMemberId(Long memberId);
}
