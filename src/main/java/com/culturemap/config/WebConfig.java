package com.culturemap.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // history_image 폴더를 정적 리소스로 제공
        // Spring Boot는 기본적으로 classpath:/static/을 제공하므로 별도 설정 불필요
        // 하지만 명시적으로 설정하여 일관성 유지
        registry.addResourceHandler("/history_image/**")
                .addResourceLocations("classpath:/static/history_image/");
    }
}
