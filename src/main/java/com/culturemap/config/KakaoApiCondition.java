package com.culturemap.config;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

/**
 * Kakao API 키가 존재하고 비어있지 않을 때만 true를 반환하는 Condition
 */
public class KakaoApiCondition implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String apiKey = context.getEnvironment().getProperty("kakao.rest-api-key");
        return StringUtils.hasText(apiKey);
    }
}
