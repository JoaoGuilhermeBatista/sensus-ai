package com.visaoassistiva.backend.dto.response;
import com.fasterxml.jackson.annotation.JsonProperty;
public record ObjetoDetectadoDTO(
        String nome,
        Double confidence,
        String distancia,
        @JsonProperty("isClose") Boolean isClose,
        @JsonProperty("bboxX") Double bboxX,
        @JsonProperty("bboxY") Double bboxY,
        @JsonProperty("bboxWidth") Double bboxWidth,
        @JsonProperty("bboxHeight") Double bboxHeight
) {}