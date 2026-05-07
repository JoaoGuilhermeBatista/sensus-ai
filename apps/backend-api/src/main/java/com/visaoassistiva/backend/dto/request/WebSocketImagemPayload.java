package com.visaoassistiva.backend.dto.request;

public record WebSocketImagemPayload(
        String tipo,
        String dados,
        String sessionId
) {}