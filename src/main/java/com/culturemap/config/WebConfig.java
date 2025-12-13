package com.culturemap.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // history_image 폴더를 정적 리소스로 제공
        String historyImagePath = Paths.get("history_image").toAbsolutePath().toString();
        registry.addResourceHandler("/history_image/**")
                .addResourceLocations("file:" + historyImagePath + "/");
    }
}
