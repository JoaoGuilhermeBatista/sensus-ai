package com.visaoassistiva.backend.dto.infer;

import com.fasterxml.jackson.annotation.JsonProperty;

public record InferDetectedObjectDTO(
        String name,
        double confidence,
        double x,
        double y,
        double width,
        double height,
        String distance,
        @JsonProperty("isClose") boolean isClose
) {}
