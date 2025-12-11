package com.culturemap.service;

import com.culturemap.domain.Member;
import com.culturemap.dto.AuthRequest;
import com.culturemap.dto.AuthResponse;
import com.culturemap.dto.SignupRequest;
import com.culturemap.repository.MemberRepository;
import com.culturemap.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse signup(SignupRequest request) {
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다");
        }

        Member member = Member.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .build();

        memberRepository.save(member);

        String token = jwtUtil.generateToken(member.getEmail());

        return AuthResponse.builder()
                .token(token)
                .email(member.getEmail())
                .nickname(member.getNickname())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        Member member = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다"));

        if (!passwordEncoder.matches(request.getPassword(), member.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다");
        }

        String token = jwtUtil.generateToken(member.getEmail());

        return AuthResponse.builder()
                .token(token)
                .email(member.getEmail())
                .nickname(member.getNickname())
                .build();
    }
}

