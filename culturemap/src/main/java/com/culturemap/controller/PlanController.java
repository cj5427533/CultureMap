package com.culturemap.controller;

import com.culturemap.dto.AddPlaceToPlanRequest;
import com.culturemap.dto.PlanRequest;
import com.culturemap.dto.PlanResponse;
import com.culturemap.service.PlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @PostMapping
    public ResponseEntity<PlanResponse> createPlan(@Valid @RequestBody PlanRequest request, Authentication authentication) {
        PlanResponse response = planService.createPlan(request, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<PlanResponse>> getMyPlans(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication) {
        List<PlanResponse> responses;
        if (date != null) {
            responses = planService.getMyPlansByDate(date, authentication);
        } else {
            responses = planService.getMyPlans(authentication);
        }
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanResponse> getPlan(@PathVariable Long id, Authentication authentication) {
        PlanResponse response = planService.getPlan(id, authentication);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlanResponse> updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody PlanRequest request,
            Authentication authentication) {
        PlanResponse response = planService.updatePlan(id, request, authentication);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id, Authentication authentication) {
        planService.deletePlan(id, authentication);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/add-place")
    public ResponseEntity<PlanResponse> addPlaceToPlan(
            @Valid @RequestBody AddPlaceToPlanRequest request,
            Authentication authentication) {
        PlanResponse response = planService.addPlaceToPlan(request, authentication);
        return ResponseEntity.ok(response);
    }
}

