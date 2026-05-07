package com.visaoassistiva.backend.controller;

import com.visaoassistiva.backend.dto.response.ApiResponseWrapper;
import com.visaoassistiva.backend.dto.response.StatusResponseDTO;
import com.visaoassistiva.backend.integration.IAIntegrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class StatusController {

    private final IAIntegrationService iaIntegrationService;

    public StatusController(IAIntegrationService iaIntegrationService) {
        this.iaIntegrationService = iaIntegrationService;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponseWrapper<StatusResponseDTO>> status() {
        boolean iaUp = iaIntegrationService.verificarSaude();
        StatusResponseDTO dto = new StatusResponseDTO(
                "UP",
                iaUp ? "UP" : "DOWN",
                System.currentTimeMillis() / 1000
        );
        return ResponseEntity.ok(ApiResponseWrapper.ok(dto));
    }
}