package com.visaoassistiva.backend.dto.response;

import java.util.List;

public record AnaliseResponseDTO(
        Long id,
        Long timestamp,
        List<ObjetoDetectadoDTO> objetos
) {}
