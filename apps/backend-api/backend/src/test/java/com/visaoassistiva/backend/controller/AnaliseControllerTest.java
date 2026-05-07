package com.visaoassistiva.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.visaoassistiva.backend.dto.response.AnaliseResponseDTO;
import com.visaoassistiva.backend.dto.response.ObjetoDetectadoDTO;
import com.visaoassistiva.backend.exception.AnaliseNotFoundException;
import com.visaoassistiva.backend.exception.GlobalExceptionHandler;
import com.visaoassistiva.backend.exception.IAServiceException;
import com.visaoassistiva.backend.service.AnaliseService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Base64;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AnaliseController.class)
@Import(GlobalExceptionHandler.class)
class AnaliseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AnaliseService analiseService;

    private static final String BASE64_VALIDO = Base64.getEncoder().encodeToString("imagem-fake".getBytes());

    @Test
    void postAnalisar_deveRetornar200QuandoSucesso() throws Exception {
        AnaliseResponseDTO dto = new AnaliseResponseDTO(1L, 1711370000L,
                List.of(new ObjetoDetectadoDTO("person", "perto", true)));

        when(analiseService.processarImagem(any())).thenReturn(dto);

        String body = """
                {"imagemBase64": "%s"}
                """.formatted(BASE64_VALIDO);

        mockMvc.perform(post("/api/analisar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sucesso").value(true))
                .andExpect(jsonPath("$.dados.id").value(1))
                .andExpect(jsonPath("$.dados.objetos[0].nome").value("person"));
    }

    @Test
    void postAnalisar_deveRetornar400QuandoBase64Invalido() throws Exception {
        String body = """
                {"imagemBase64": "!!!nao-e-base64!!!"}
                """;

        mockMvc.perform(post("/api/analisar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.sucesso").value(false));
    }

    @Test
    void postAnalisar_deveRetornar400QuandoCampoObrigatorioAusente() throws Exception {
        String body = "{}";

        mockMvc.perform(post("/api/analisar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postAnalisar_deveRetornar503QuandoIAIndisponivel() throws Exception {
        when(analiseService.processarImagem(any())).thenThrow(new IAServiceException("IA fora do ar"));

        String body = """
                {"imagemBase64": "%s"}
                """.formatted(BASE64_VALIDO);

        mockMvc.perform(post("/api/analisar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.sucesso").value(false));
    }

    @Test
    void getAnalises_deveRetornar200ComPaginacao() throws Exception {
        AnaliseResponseDTO dto = new AnaliseResponseDTO(1L, 1711370000L, List.of());
        when(analiseService.listarAnalises(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(dto)));

        mockMvc.perform(get("/api/analises"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    void getAnalisePorId_deveRetornar200QuandoEncontrado() throws Exception {
        AnaliseResponseDTO dto = new AnaliseResponseDTO(42L, 1711370000L, List.of());
        when(analiseService.buscarPorId(42L)).thenReturn(dto);

        mockMvc.perform(get("/api/analises/42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sucesso").value(true))
                .andExpect(jsonPath("$.dados.id").value(42));
    }

    @Test
    void getAnalisePorId_deveRetornar404QuandoNaoEncontrado() throws Exception {
        when(analiseService.buscarPorId(99L))
                .thenThrow(new AnaliseNotFoundException(99L));

        mockMvc.perform(get("/api/analises/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.sucesso").value(false));
    }
}