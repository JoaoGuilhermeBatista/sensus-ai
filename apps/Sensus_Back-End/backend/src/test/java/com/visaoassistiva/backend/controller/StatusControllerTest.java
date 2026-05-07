package com.visaoassistiva.backend.controller;

import com.visaoassistiva.backend.exception.GlobalExceptionHandler;
import com.visaoassistiva.backend.integration.IAIntegrationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = StatusController.class)
@Import(GlobalExceptionHandler.class)
class StatusControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IAIntegrationService iaIntegrationService;

    @Test
    void getStatus_deveRetornarBackendUpEIaUp() throws Exception {
        when(iaIntegrationService.verificarSaude()).thenReturn(true);

        mockMvc.perform(get("/api/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sucesso").value(true))
                .andExpect(jsonPath("$.dados.backend").value("UP"))
                .andExpect(jsonPath("$.dados.iaService").value("UP"))
                .andExpect(jsonPath("$.dados.timestamp").isNumber());
    }

    @Test
    void getStatus_deveRetornarIaDownQuandoServicoCaiu() throws Exception {
        when(iaIntegrationService.verificarSaude()).thenReturn(false);

        mockMvc.perform(get("/api/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dados.backend").value("UP"))
                .andExpect(jsonPath("$.dados.iaService").value("DOWN"));
    }
}