package com.visaoassistiva.backend.service;

import com.visaoassistiva.backend.config.AppProperties;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private final int maxFps;
    // long[0] = janela de início (ms), long[1] = contador de frames na janela
    private final ConcurrentHashMap<String, long[]> sessionWindows = new ConcurrentHashMap<>();

    public RateLimiterService(AppProperties props) {
        this.maxFps = props.getRateLimit().getFps();
    }

    public boolean permitir(String sessionId) {
        long agora = System.currentTimeMillis();
        long[] janela = sessionWindows.computeIfAbsent(sessionId, k -> new long[]{agora, 0});

        synchronized (janela) {
            if (agora - janela[0] >= 1000) {
                janela[0] = agora;
                janela[1] = 1;
                return true;
            }
            if (janela[1] < maxFps) {
                janela[1]++;
                return true;
            }
            return false;
        }
    }

    public void removerSessao(String sessionId) {
        sessionWindows.remove(sessionId);
    }
}
