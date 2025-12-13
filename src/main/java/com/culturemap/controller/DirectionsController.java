package com.culturemap.controller;

import com.culturemap.dto.DirectionsRequest;
import com.culturemap.dto.DirectionsResponse;
import com.culturemap.service.DirectionsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/directions")
@RequiredArgsConstructor
public class DirectionsController {

    private final DirectionsService directionsService;

    @PostMapping
    public ResponseEntity<DirectionsResponse> getDirections(@Valid @RequestBody DirectionsRequest request) {
        DirectionsResponse response = directionsService.getCarDirections(request);
        return ResponseEntity.ok(response);
    }
}
