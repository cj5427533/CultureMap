package com.culturemap.controller;

import com.culturemap.dto.AdminStatsResponse;
import com.culturemap.repository.MemberRepository;
import com.culturemap.service.AdminStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminStatsService adminStatsService;
    private final MemberRepository memberRepository;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        try {
            // 관리자 권한 확인
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new ResponseStatusException(FORBIDDEN, "인증이 필요합니다.");
            }

            String email = authentication.getName();
            boolean isAdmin = memberRepository.findByEmail(email)
                    .map(member -> "ADMIN".equals(member.getRole()))
                    .orElse(false);

            if (!isAdmin) {
                throw new ResponseStatusException(FORBIDDEN, "관리자만 접근할 수 있습니다.");
            }

            AdminStatsResponse stats = adminStatsService.getStats();
            return ResponseEntity.ok(stats);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "통계를 불러오는데 실패했습니다: " + e.getMessage(),
                    e
            );
        }
    }
}
