package com.visaoassistiva.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ImagemRequestDTO(
        @NotBlank String imagemBase64,
        String formato
) {}