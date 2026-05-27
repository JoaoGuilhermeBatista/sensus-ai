package com.visaoassistiva.backend.dto.infer;

public record InferRequestDTO(
        String frameId,
        long timestamp,
        String image,
        String cameraId
) {}
