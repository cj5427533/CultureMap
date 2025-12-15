package com.culturemap.controller;

import com.culturemap.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteCurrentMember(Authentication authentication) {
        memberService.deleteCurrentMember(authentication);
        return ResponseEntity.noContent().build();
    }
}

