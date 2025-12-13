package com.culturemap.config;

import com.culturemap.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class AdminInitializer {

    private final MemberService memberService;

    @Bean
    public ApplicationRunner initializeAdmin() {
        return args -> {
            try {
                memberService.initializeAdminAccount();
            } catch (Exception e) {
                log.error("어드민 계정 초기화 실패", e);
            }
        };
    }
}
