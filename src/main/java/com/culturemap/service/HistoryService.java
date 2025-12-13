package com.culturemap.service;

import com.culturemap.domain.History;
import com.culturemap.domain.Member;
import com.culturemap.dto.HistoryResponse;
import com.culturemap.repository.HistoryRepository;
import com.culturemap.repository.MemberRepository;
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
public class HistoryService {

    private final HistoryRepository historyRepository;
    private final MemberRepository memberRepository;

    public List<HistoryResponse> getMyHistories(Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        List<History> histories = historyRepository.findByMemberIdOrderByDisplayOrderAsc(member.getId());
        return histories.stream()
                .map(history -> HistoryResponse.builder()
                        .id(history.getId())
                        .imageUrl(history.getImageUrl())
                        .eventDate(history.getEventDate())
                        .location(history.getLocation())
                        .displayOrder(history.getDisplayOrder())
                        .createdAt(history.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
