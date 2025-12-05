package com.culturemap.controller;

import com.culturemap.dto.PlanPostRequest;
import com.culturemap.dto.PlanPostResponse;
import com.culturemap.service.PlanPostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PlanPostController {

    private final PlanPostService planPostService;

    @PostMapping
    public ResponseEntity<PlanPostResponse> createPost(
            @Valid @RequestBody PlanPostRequest request,
            Authentication authentication) {
        PlanPostResponse response = planPostService.createPost(request, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<PlanPostResponse>> getAllPosts() {
        List<PlanPostResponse> responses = planPostService.getAllPosts();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanPostResponse> getPost(@PathVariable Long id) {
        PlanPostResponse response = planPostService.getPost(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlanPostResponse> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PlanPostRequest request,
            Authentication authentication) {
        PlanPostResponse response = planPostService.updatePost(id, request, authentication);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id, Authentication authentication) {
        planPostService.deletePost(id, authentication);
        return ResponseEntity.noContent().build();
    }
}

