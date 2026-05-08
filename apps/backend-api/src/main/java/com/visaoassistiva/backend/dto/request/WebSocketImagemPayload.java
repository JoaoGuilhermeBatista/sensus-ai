package com.visaoassistiva.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record WebSocketImagemPayload(
        String tipo,
        String dados,
        String sessionId
) {}