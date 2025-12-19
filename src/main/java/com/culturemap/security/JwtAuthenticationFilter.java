package com.culturemap.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class  JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String requestPath = request.getRequestURI();
        
        logger.debug("JWT 필터 - 요청 경로: {}, Authorization 헤더 존재: {}", requestPath, authHeader != null);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            
            try {
                String email = jwtUtil.getEmailFromToken(token);
                logger.debug("JWT 필터 - 토큰에서 이메일 추출: {}", email);

                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // 토큰이 유효한 경우에만 사용자 정보 로드
                    if (jwtUtil.validateToken(token)) {
                        try {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(
                                            userDetails, null, userDetails.getAuthorities());
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                            logger.debug("JWT 필터 - 인증 성공: {}", email);
                        } catch (org.springframework.security.core.userdetails.UsernameNotFoundException e) {
                            // 사용자를 찾을 수 없어도 필터는 통과 (permitAll 경로를 위해)
                            // 로그만 남기고 계속 진행
                            logger.warn("사용자를 찾을 수 없습니다: " + email);
                        }
                    } else {
                        logger.warn("토큰이 유효하지 않습니다 - 경로: {}", requestPath);
                    }
                }
            } catch (Exception e) {
                // 토큰 파싱 실패 등 예외 발생 시에도 필터는 통과
                // 로그만 남기고 계속 진행
                logger.warn("JWT 토큰 처리 중 오류 발생 - 경로: {}, 오류: {}", requestPath, e.getMessage());
                e.printStackTrace();
            }
        } else {
            logger.debug("JWT 필터 - Authorization 헤더 없음 또는 Bearer 형식 아님 - 경로: {}", requestPath);
        }

        filterChain.doFilter(request, response);
    }
}

