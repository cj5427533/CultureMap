package com.culturemap.controller;

import com.culturemap.dto.HistoryResponse;
import com.culturemap.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/histories")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    @GetMapping
    public ResponseEntity<List<HistoryResponse>> getMyHistories(Authentication authentication) {
        List<HistoryResponse> responses = historyService.getMyHistories(authentication);
        return ResponseEntity.ok(responses);
    }
}
