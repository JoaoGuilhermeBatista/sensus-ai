package com.visaoassistiva.backend.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.visaoassistiva.backend.dto.request.WebSocketImagemPayload;
import com.visaoassistiva.backend.dto.response.AnaliseResponseDTO;
import com.visaoassistiva.backend.exception.IAServiceException;
import com.visaoassistiva.backend.service.AnaliseService;
import com.visaoassistiva.backend.service.RateLimiterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;

import java.util.Base64;

@Component
public class ImagemWebSocketHandler extends AbstractWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ImagemWebSocketHandler.class);

    private final AnaliseService analiseService;
    private final RateLimiterService rateLimiterService;
    private final ObjectMapper objectMapper;

    public ImagemWebSocketHandler(AnaliseService analiseService,
                                  RateLimiterService rateLimiterService,
                                  ObjectMapper objectMapper) {
        this.analiseService = analiseService;
        this.rateLimiterService = rateLimiterService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.debug("[WEBSOCKET] Nova conexão: sessionId={} origin={}",
                session.getId(), session.getRemoteAddress());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        WebSocketImagemPayload payload = objectMapper.readValue(message.getPayload(), WebSocketImagemPayload.class);
        if (payload.dados() == null || payload.dados().isBlank()) {
            return;
        }
        byte[] imagem = Base64.getDecoder().decode(payload.dados());
        processarMensagem(session, imagem);
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws Exception {
        byte[] imagem = message.getPayload().array();
        processarMensagem(session, imagem);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("[WEBSOCKET] Erro de transporte: sessionId={} erro={}",
                session.getId(), exception.getMessage());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        rateLimiterService.removerSessao(session.getId());
        log.debug("[WEBSOCKET] Conexão encerrada: sessionId={} status={}", session.getId(), status);
    }

    private void processarMensagem(WebSocketSession session, byte[] imagem) throws Exception {
        log.debug("[ANALISE] Iniciando análise: sessionId={} frameSize={} bytes",
                session.getId(), imagem.length);

        if (!rateLimiterService.permitir(session.getId())) {
            return;
        }

        try {
            AnaliseResponseDTO result = analiseService.processarImagem(imagem);
            String json = objectMapper.writeValueAsString(result);
            session.sendMessage(new TextMessage(json));
            log.debug("[WEBSOCKET] Resposta enviada: sessionId={}", session.getId());
        } catch (IAServiceException e) {
            session.sendMessage(new TextMessage("{\"erro\": \"IA indisponível\"}"));
        }
    }
}