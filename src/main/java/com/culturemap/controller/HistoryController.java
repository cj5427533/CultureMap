package com.culturemap.controller;

import com.culturemap.dto.HistoryResponse;
import com.culturemap.domain.Member;
import com.culturemap.repository.MemberRepository;
import com.culturemap.service.HistoryInitService;
import com.culturemap.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/histories")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;
    private final HistoryInitService historyInitService;
    private final MemberRepository memberRepository;

    @GetMapping
    public ResponseEntity<List<HistoryResponse>> getMyHistories(Authentication authentication) {
        List<HistoryResponse> responses = historyService.getMyHistories(authentication);
        return ResponseEntity.ok(responses);
    }
    
    @PostMapping("/initialize")
    public ResponseEntity<String> initializeMyHistory(Authentication authentication) {
        try {
            String email = ((UserDetails) authentication.getPrincipal()).getUsername();
            Member member = memberRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
            
            historyInitService.initializeHistoryForMember(member);
            return ResponseEntity.ok("히스토리가 성공적으로 초기화되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("히스토리 초기화 실패: " + e.getMessage());
        }
    }
}
