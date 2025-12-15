package com.culturemap.service;

import com.culturemap.domain.Member;
import com.culturemap.domain.RefreshToken;
import com.culturemap.domain.Plan;
import com.culturemap.dto.AuthRequest;
import com.culturemap.dto.AuthResponse;
import com.culturemap.dto.SignupRequest;
import com.culturemap.repository.CommentRepository;
import com.culturemap.repository.HistoryRepository;
import com.culturemap.repository.MemberRepository;
import com.culturemap.repository.PlanMemberRepository;
import com.culturemap.repository.PlanPostRepository;
import com.culturemap.repository.PlanRepository;
import com.culturemap.repository.RefreshTokenRepository;
import com.culturemap.repository.RatingRepository;
import com.culturemap.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class MemberService {

    private final MemberRepository memberRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final HistoryInitService historyInitService;
    private final HistoryRepository historyRepository;
    private final RateLimitService rateLimitService;
    private final PlanRepository planRepository;
    private final PlanPostRepository planPostRepository;
    private final PlanMemberRepository planMemberRepository;
    private final CommentRepository commentRepository;
    private final RatingRepository ratingRepository;
    
    private static final String TARGET_EMAIL = "cj5427533@o365.jeiu.ac.kr";

    public AuthResponse signup(SignupRequest request) {
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다");
        }

        Member member = Member.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .role("USER") // 기본값은 USER
                .build();

        memberRepository.save(member);

        String accessToken = jwtUtil.generateToken(member.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(member.getEmail());
        
        // 기존 refresh token 삭제
        refreshTokenRepository.deleteByMemberId(member.getId());
        
        // 새 refresh token 저장
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .member(member)
                .token(refreshToken)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

        // 특정 이메일로 가입한 경우 히스토리 자동 초기화
        if (TARGET_EMAIL.equals(member.getEmail())) {
            try {
                historyInitService.initializeHistoryForMember(member);
                log.info("회원가입 후 히스토리 초기화 완료: {}", member.getEmail());
            } catch (Exception e) {
                log.error("회원가입 후 히스토리 초기화 실패: {}", member.getEmail(), e);
                // 히스토리 초기화 실패해도 회원가입은 성공으로 처리
            }
        }

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .email(member.getEmail())
                .nickname(member.getNickname())
                .role(member.getRole() != null ? member.getRole() : "USER")
                .build();
    }

    public AuthResponse login(AuthRequest request, String clientIp) {
        String identifier = clientIp + ":" + request.getEmail();
        
        // 레이트 리밋 확인
        if (rateLimitService.isLoginAttemptExceeded(identifier)) {
            throw new IllegalArgumentException("로그인 시도 횟수를 초과했습니다. 5분 후 다시 시도해주세요.");
        }
        
        Member member = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다"));

        if (!passwordEncoder.matches(request.getPassword(), member.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다");
        }
        
        // 로그인 성공 시 시도 횟수 초기화
        rateLimitService.resetLoginAttempts(identifier);

        String accessToken = jwtUtil.generateToken(member.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(member.getEmail());
        
        // 기존 refresh token 삭제
        refreshTokenRepository.deleteByMemberId(member.getId());
        
        // 새 refresh token 저장
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .member(member)
                .token(refreshToken)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

        // 특정 이메일로 로그인한 경우 히스토리 자동 초기화
        if (TARGET_EMAIL.equals(member.getEmail())) {
            try {
                historyInitService.initializeHistoryForMember(member);
                log.info("로그인 후 히스토리 초기화 완료: {}", member.getEmail());
            } catch (Exception e) {
                log.error("로그인 후 히스토리 초기화 실패: {}", member.getEmail(), e);
                // 히스토리 초기화 실패해도 로그인은 성공으로 처리
            }
        }

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .email(member.getEmail())
                .nickname(member.getNickname())
                .role(member.getRole() != null ? member.getRole() : "USER")
                .build();
    }

    /**
     * 어드민 계정 초기화 (애플리케이션 시작 시 호출)
     * 지정된 이메일 계정을 ADMIN으로 설정
     */
    @Transactional
    public void initializeAdminAccount() {
        String adminEmail = "cj5427533@o365.jeiu.ac.kr";
        memberRepository.findByEmail(adminEmail).ifPresent(member -> {
            if (!"ADMIN".equals(member.getRole())) {
                Member updatedMember = Member.builder()
                        .id(member.getId())
                        .email(member.getEmail())
                        .password(member.getPassword())
                        .nickname(member.getNickname())
                        .role("ADMIN")
                        .createdAt(member.getCreatedAt())
                        .build();
                memberRepository.save(updatedMember);
                log.info("어드민 계정이 설정되었습니다: {}", adminEmail);
            }
        });
    }

    public AuthResponse refreshAccessToken(String refreshTokenString) {
        // Refresh token 검증
        if (!jwtUtil.validateToken(refreshTokenString)) {
            throw new IllegalArgumentException("유효하지 않은 refresh token입니다");
        }

        // DB에서 refresh token 조회
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenString)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 refresh token입니다"));

        // 만료 확인
        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new IllegalArgumentException("만료된 refresh token입니다");
        }

        Member member = refreshToken.getMember();
        
        // 새 access token 생성
        String newAccessToken = jwtUtil.generateToken(member.getEmail());

        return AuthResponse.builder()
                .token(newAccessToken)
                .refreshToken(refreshTokenString) // 기존 refresh token 유지
                .email(member.getEmail())
                .nickname(member.getNickname())
                .role(member.getRole() != null ? member.getRole() : "USER")
                .build();
    }

    /**
     * 현재 인증된 사용자의 계정 및 관련 데이터를 삭제
     * - 댓글, 평점, 협업 플랜 참여 기록, 소유 플랜/게시글, 히스토리, 토큰 순으로 정리
     */
    public void deleteCurrentMember(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("인증 정보가 없습니다");
        }

        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        Long memberId = member.getId();

        // 다른 사용자의 콘텐츠에 남긴 기록 정리
        commentRepository.deleteByMemberId(memberId);
        ratingRepository.deleteByMemberId(memberId);

        // 협업 플랜 참여 기록 제거
        planMemberRepository.deleteByMemberId(memberId);

        // 사용자가 소유한 플랜 및 공유 게시글 삭제
        List<Plan> myPlans = planRepository.findByMember(member);
        if (!myPlans.isEmpty()) {
            List<Long> planIds = myPlans.stream()
                    .map(Plan::getId)
                    .toList();
            planPostRepository.deleteByPlanIdIn(planIds);
            planRepository.deleteAll(myPlans);
        }

        // 히스토리 및 토큰 삭제
        historyRepository.deleteByMemberId(memberId);
        refreshTokenRepository.deleteByMemberId(memberId);

        // 최종 회원 삭제
        memberRepository.delete(member);
    }

    /**
     * Authentication 객체에서 사용자 ID 추출
     * @param authentication 인증 객체
     * @return 사용자 ID, 인증되지 않은 경우 null
     */
    @Transactional(readOnly = true)
    public Long getUserIdByAuthentication(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        try {
            String email = ((UserDetails) authentication.getPrincipal()).getUsername();
            return memberRepository.findByEmail(email)
                    .map(Member::getId)
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}

