package com.culturemap.controller;

import com.culturemap.dto.AuthRequest;
import com.culturemap.dto.AuthResponse;
import com.culturemap.dto.RefreshTokenRequest;
import com.culturemap.dto.SignupRequest;
import com.culturemap.service.MemberService;
import com.culturemap.util.HttpUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final MemberService memberService;

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
        
        try {
            AuthResponse response = memberService.login(request, clientIp);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // 로그인 실패는 레이트 리밋에 카운트되지만, 시도 횟수는 유지됨
            if (e.getMessage().contains("로그인 시도 횟수를 초과")) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, e.getMessage());
            }
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = memberService.refreshAccessToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }
}

