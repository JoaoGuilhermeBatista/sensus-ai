package com.visaoassistiva.backend.dto;

import com.visaoassistiva.backend.dto.response.ObjetoDetectadoDTO;

import java.util.List;

public record IAResponseDTO(
        List<ObjetoDetectadoDTO> objetos,
        Long timestamp
) {}