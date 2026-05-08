package com.visaoassistiva.backend.dto.infer;

public record InferDetectedObjectDTO(
        String name,
        double confidence,
        double x,
        double y,
        double width,
        double height,
        String distance,
        boolean isClose
) {}
