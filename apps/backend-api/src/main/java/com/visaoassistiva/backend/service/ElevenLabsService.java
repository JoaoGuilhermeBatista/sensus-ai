package com.visaoassistiva.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
public class ElevenLabsService {

    private static final Logger log = LoggerFactory.getLogger(ElevenLabsService.class);
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${elevenlabs.api-key}")
    private String apiKey;

    @Value("${elevenlabs.voice-id}")
    private String voiceId;

    @Value("${elevenlabs.model}")
    private String model;

    public ElevenLabsService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public byte[] getAudio(String text, boolean isClose) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("ElevenLabs API Key is missing.");
            throw new RuntimeException("ElevenLabs API Key is not configured.");
        }

        try {
            Map<String, Object> voiceSettings = new HashMap<>();
            voiceSettings.put("stability", isClose ? 0.35 : 0.55);
            voiceSettings.put("similarity_boost", isClose ? 0.85 : 0.75);
            voiceSettings.put("speed", isClose ? 1.15 : 1.0);

            Map<String, Object> bodyMap = new HashMap<>();
            bodyMap.put("text", text);
            bodyMap.put("model_id", model);
            bodyMap.put("voice_settings", voiceSettings);

            String requestBody = objectMapper.writeValueAsString(bodyMap);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.elevenlabs.io/v1/text-to-speech/" + voiceId))
                    .header("xi-api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "audio/mpeg")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() == 200) {
                return response.body();
            } else {
                log.error("ElevenLabs API error: {} - {}", response.statusCode(), new String(response.body()));
                throw new RuntimeException("ElevenLabs API error: " + response.statusCode());
            }

        } catch (Exception e) {
            log.error("Failed to fetch audio from ElevenLabs", e);
            throw new RuntimeException("Failed to fetch audio from ElevenLabs", e);
        }
    }
}
