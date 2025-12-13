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
public class DirectionsController {

    private final DirectionsService directionsService;

    public DirectionsController(@org.springframework.beans.factory.annotation.Autowired(required = false) DirectionsService directionsService) {
        this.directionsService = directionsService;
    }

    @PostMapping
    public ResponseEntity<DirectionsResponse> getDirections(@Valid @RequestBody DirectionsRequest request) {
        if (directionsService == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE)
                    .body(null);
        }
        DirectionsResponse response = directionsService.getCarDirections(request);
        return ResponseEntity.ok(response);
    }
}
