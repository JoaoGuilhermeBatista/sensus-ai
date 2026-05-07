package com.visaoassistiva.backend.dto.response;

public record ObjetoDetectadoDTO(
        String nome,
        String distancia,
        Boolean isClose
) {}
