package com.visaoassistiva.backend.service;

import com.visaoassistiva.backend.config.AppProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimiterServiceTest {

    private RateLimiterService rateLimiter;

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties();
        props.getRateLimit().setFps(3);
        rateLimiter = new RateLimiterService(props);
    }

    @Test
    void devePermitirFramesDentroDoLimite() {
        assertThat(rateLimiter.permitir("sessao-1")).isTrue();
        assertThat(rateLimiter.permitir("sessao-1")).isTrue();
        assertThat(rateLimiter.permitir("sessao-1")).isTrue();
    }

    @Test
    void deveRejeitarFramesAlemDoLimite() {
        rateLimiter.permitir("sessao-2");
        rateLimiter.permitir("sessao-2");
        rateLimiter.permitir("sessao-2");

        assertThat(rateLimiter.permitir("sessao-2")).isFalse();
    }

    @Test
    void deveTerContadoresIndependentesPorSessao() {
        rateLimiter.permitir("sessao-a");
        rateLimiter.permitir("sessao-a");
        rateLimiter.permitir("sessao-a");

        // sessao-b não deve ser afetada pelo limite de sessao-a
        assertThat(rateLimiter.permitir("sessao-b")).isTrue();
        assertThat(rateLimiter.permitir("sessao-a")).isFalse();
    }

    @Test
    void deveRemoverSessaoSemErro() {
        rateLimiter.permitir("sessao-x");
        rateLimiter.removerSessao("sessao-x");

        // Após remoção, nova janela deve ser aberta
        assertThat(rateLimiter.permitir("sessao-x")).isTrue();
    }

    @Test
    void deveReiniciarJanelaAposUmSegundo() throws InterruptedException {
        rateLimiter.permitir("sessao-3");
        rateLimiter.permitir("sessao-3");
        rateLimiter.permitir("sessao-3");
        assertThat(rateLimiter.permitir("sessao-3")).isFalse();

        Thread.sleep(1100); // espera janela resetar

        assertThat(rateLimiter.permitir("sessao-3")).isTrue();
    }
}