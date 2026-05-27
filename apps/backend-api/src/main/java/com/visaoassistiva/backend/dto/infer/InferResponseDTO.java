package com.visaoassistiva.backend.dto.infer;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record InferResponseDTO(
        @JsonProperty("frameId") String frameId,
        long timestamp,
        @JsonProperty("inferenceMs") double inferenceMs,
        List<InferDetectedObjectDTO> objects
) {}
