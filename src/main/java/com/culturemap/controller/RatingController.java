package com.culturemap.controller;

import com.culturemap.dto.RatingRequest;
import com.culturemap.dto.RatingResponse;
import com.culturemap.service.RatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    public ResponseEntity<RatingResponse> createOrUpdateRating(
            @Valid @RequestBody RatingRequest request,
            Authentication authentication) {
        RatingResponse response = ratingService.createOrUpdateRating(request, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<RatingResponse> getRating(
            @PathVariable Long postId,
            Authentication authentication) {
        RatingResponse response = ratingService.getRating(postId, authentication);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/post/{postId}")
    public ResponseEntity<Void> deleteRating(
            @PathVariable Long postId,
            Authentication authentication) {
        ratingService.deleteRating(postId, authentication);
        return ResponseEntity.noContent().build();
    }
}
