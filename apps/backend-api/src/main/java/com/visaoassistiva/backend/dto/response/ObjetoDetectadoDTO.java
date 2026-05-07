package com.visaoassistiva.backend.dto.response;
import com.fasterxml.jackson.annotation.JsonProperty;
public record ObjetoDetectadoDTO(
        String nome,
        String distancia,
        Boolean isClose,
        @JsonProperty("bboxX") Double bboxX,
        @JsonProperty("bboxY") Double bboxY,
        @JsonProperty("bboxWidth") Double bboxWidth,
        @JsonProperty("bboxHeight") Double bboxHeight
) {}