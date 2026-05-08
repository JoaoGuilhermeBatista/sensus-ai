package com.visaoassistiva.backend.dto.infer;

import java.util.List;

public record InferResponseDTO(
        String frameId,
        long timestamp,
        double inferenceMs,
        List<InferDetectedObjectDTO> objects
) {}
