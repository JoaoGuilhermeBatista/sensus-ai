package com.visaoassistiva.backend.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.visaoassistiva.backend.service.AnaliseService;
import com.visaoassistiva.backend.service.RateLimiterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ImagemWebSocketHandlerHeartbeatTest {

    @Mock private AnaliseService analiseService;
    @Mock private RateLimiterService rateLimiterService;
    @Mock private WebSocketSession session;

    private ImagemWebSocketHandler handler;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        handler = new ImagemWebSocketHandler(analiseService, rateLimiterService, objectMapper);
    }

    @Test
    void deveIgnorarHeartbeatSemChamarAnaliseService() throws Exception {
        String heartbeat = "{\"type\":\"heartbeat\",\"timestamp\":1700000000000}";

        handler.handleMessage(session, new TextMessage(heartbeat));

        verifyNoInteractions(analiseService);
        verifyNoInteractions(rateLimiterService);
    }

    @Test
    void naoDeveEnviarRespostaParaHeartbeat() throws Exception {
        String heartbeat = "{\"type\":\"heartbeat\",\"timestamp\":1700000000000}";

        handler.handleMessage(session, new TextMessage(heartbeat));

        verify(session, never()).sendMessage(any());
    }

    @Test
    void deveTratarHeartbeatComCamposExtrasSemdFalhar() throws Exception {
        String heartbeat = "{\"type\":\"heartbeat\",\"timestamp\":1700000000000,\"extra\":\"ignored\"}";

        handler.handleMessage(session, new TextMessage(heartbeat));

        verifyNoInteractions(analiseService);
    }

    @Test
    void deveContinuarProcessandoFrameAposHeartbeat() throws Exception {
        // First send a heartbeat — must not break the handler state
        handler.handleMessage(session, new TextMessage(
                "{\"type\":\"heartbeat\",\"timestamp\":1700000000000}"
        ));

        // Then a frame with empty dados — handler should run without exception
        // (dados blank → early return, no AnaliseService call)
        handler.handleMessage(session, new TextMessage(
                "{\"tipo\":\"imagem\",\"dados\":\"\"}"
        ));

        verifyNoInteractions(analiseService);
    }

    @Test
    void deveReconhecerHeartbeatCaseInsensitiveNao() throws Exception {
        // Type matching is case-sensitive ("heartbeat" only, not "Heartbeat")
        // A "Heartbeat" (capital H) message should fall through to the frame handler
        // and fail gracefully (null dados → early return), not crash
        String wrongCase = "{\"type\":\"Heartbeat\",\"timestamp\":1700000000000}";

        // Should not throw even though it's not recognized as heartbeat
        handler.handleMessage(session, new TextMessage(wrongCase));

        // "Heartbeat" with capital H is not SDD-compliant — no inference should run
        verifyNoInteractions(analiseService);
    }
}
