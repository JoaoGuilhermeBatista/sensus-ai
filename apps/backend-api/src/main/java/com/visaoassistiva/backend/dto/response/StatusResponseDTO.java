package com.visaoassistiva.backend.dto.response;

public record StatusResponseDTO(
        String backend,
        String iaService,
        Long timestamp
) {}