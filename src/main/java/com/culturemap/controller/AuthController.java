package com.culturemap.controller;

import com.culturemap.dto.AuthRequest;
import com.culturemap.dto.AuthResponse;
import com.culturemap.dto.RefreshTokenRequest;
import com.culturemap.dto.SignupRequest;
import com.culturemap.service.MemberService;
import com.culturemap.service.RateLimitService;
import com.culturemap.util.HttpUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final MemberService memberService;
    private final RateLimitService rateLimitService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        AuthResponse response = memberService.signup(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody AuthRequest request,
            HttpServletRequest httpRequest) {
        
        String clientIp = HttpUtil.getClientIpAddress(httpRequest);
        String identifier = clientIp + ":" + request.getEmail();
        
        // 레이트 리밋 확인
        if (rateLimitService.isLoginAttemptExceeded(identifier)) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "로그인 시도 횟수를 초과했습니다. 5분 후 다시 시도해주세요.");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(null);
        }
        
        try {
            AuthResponse response = memberService.login(request);
            // 로그인 성공 시 시도 횟수 초기화
            rateLimitService.resetLoginAttempts(identifier);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // 로그인 실패는 레이트 리밋에 카운트되지만, 시도 횟수는 유지됨
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = memberService.refreshAccessToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }
}

