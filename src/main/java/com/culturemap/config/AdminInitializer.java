package com.culturemap.config;

import com.culturemap.service.HistoryInitService;
import com.culturemap.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class AdminInitializer {

    private final MemberService memberService;
    private final HistoryInitService historyInitService;
    private final Environment environment;

    @Bean
    public ApplicationRunner initializeAdmin() {
        return args -> {
            // 테스트 프로파일에서는 초기화 건너뛰기
            String[] activeProfiles = environment.getActiveProfiles();
            for (String profile : activeProfiles) {
                if ("test".equals(profile)) {
                    log.info("테스트 프로파일 감지: Admin 초기화를 건너뜁니다.");
                    return;
                }
            }
            
            try {
                memberService.initializeAdminAccount();
                historyInitService.initializeHistoryImages();
            } catch (Exception e) {
                log.error("초기화 실패", e);
            }
        };
    }
}
