package com.visaoassistiva.backend.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.visaoassistiva.backend.dto.request.WebSocketImagemPayload;
import com.visaoassistiva.backend.dto.response.AnaliseResponseDTO;
import com.visaoassistiva.backend.exception.IAServiceException;
import com.visaoassistiva.backend.service.AnaliseService;
import com.visaoassistiva.backend.service.RateLimiterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
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
    public void afterConnectionEstablished(@NonNull WebSocketSession session) {
        log.debug("[WEBSOCKET] Nova conexão: sessionId={} origin={}",
                session.getId(), session.getRemoteAddress());
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message) throws Exception {
        JsonNode root = objectMapper.readTree(message.getPayload());

        // SDD 04: heartbeat events must be handled without triggering inference
        String type = root.path("type").asText("");
        if ("heartbeat".equals(type)) {
            log.debug("[WEBSOCKET] Heartbeat recebido: sessionId={}", session.getId());
            return;
        }

        WebSocketImagemPayload payload = objectMapper.treeToValue(root, WebSocketImagemPayload.class);
        if (payload.dados() == null || payload.dados().isBlank()) {
            return;
        }
        byte[] imagem = Base64.getDecoder().decode(payload.dados());
        processarMensagem(session, imagem);
    }

    @Override
    protected void handleBinaryMessage(@NonNull WebSocketSession session, @NonNull BinaryMessage message) throws Exception {
        byte[] imagem = message.getPayload().array();
        processarMensagem(session, imagem);
    }

    @Override
    public void handleTransportError(@NonNull WebSocketSession session, @NonNull Throwable exception) {
        log.error("[WEBSOCKET] Erro de transporte: sessionId={} erro={}",
                session.getId(), exception.getMessage());
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) {
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
        } catch (Exception e) {
            log.warn("[WEBSOCKET] Erro ao processar frame, mantendo sessão: sessionId={} erro={}",
                    session.getId(), e.getMessage());
        }
    }
}
