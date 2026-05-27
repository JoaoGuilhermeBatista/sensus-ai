package com.visaoassistiva.backend.integration;

import com.visaoassistiva.backend.dto.IAResponseDTO;
import com.visaoassistiva.backend.dto.infer.InferRequestDTO;
import com.visaoassistiva.backend.dto.infer.InferResponseDTO;
import com.visaoassistiva.backend.dto.response.ObjetoDetectadoDTO;
import com.visaoassistiva.backend.exception.IAServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class IAIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(IAIntegrationService.class);

    private final WebClient webClient;

    public IAIntegrationService(WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<IAResponseDTO> enviarParaIA(byte[] imagemBytes, String cameraId) {
        String frameId = UUID.randomUUID().toString();
        long timestamp = System.currentTimeMillis();
        String base64Image = Base64.getEncoder().encodeToString(imagemBytes);

        InferRequestDTO request = new InferRequestDTO(frameId, timestamp, base64Image, cameraId);

        log.debug("[IA] Chamando serviço: POST /infer frameId={}", frameId);
        long inicio = System.currentTimeMillis();

        return webClient.post()
                .uri("/infer")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.isError(),
                        resp -> Mono.error(new IAServiceException("Serviço de IA retornou erro: " + resp.statusCode())))
                .bodyToMono(InferResponseDTO.class)
                .timeout(Duration.ofSeconds(5))
                .retryWhen(Retry.fixedDelay(1, Duration.ofMillis(500))
                        .filter(e -> !(e instanceof IAServiceException)))
                .map(infer -> toIAResponseDTO(infer, timestamp))
                .doOnSuccess(resp -> log.debug("[IA] Resposta recebida: objetos={} inferenceMs={} latencia={}ms",
                        resp != null && resp.objetos() != null ? resp.objetos().size() : 0,
                        resp != null ? "-" : "n/a",
                        System.currentTimeMillis() - inicio))
                .onErrorMap(e -> !(e instanceof IAServiceException),
                        e -> new IAServiceException("Falha ao comunicar com serviço de IA: " + e.getMessage()));
    }

    public boolean verificarSaude() {
        try {
            webClient.get()
                    .uri("/health")
                    .retrieve()
                    .toBodilessEntity()
                    .block(Duration.ofSeconds(3));
            return true;
        } catch (Exception e) {
            log.debug("[IA] Serviço de IA indisponível: {}", e.getMessage());
            return false;
        }
    }

    private IAResponseDTO toIAResponseDTO(InferResponseDTO infer, long timestamp) {
        if (infer == null || infer.objects() == null) {
            return new IAResponseDTO(List.of(), timestamp);
        }
        List<ObjetoDetectadoDTO> objetos = infer.objects().stream()
                .map(o -> new ObjetoDetectadoDTO(
                        o.name(),
                        o.distance(),
                        o.isClose(),
                        o.x(),
                        o.y(),
                        o.width(),
                        o.height()
                ))
                .toList();
        return new IAResponseDTO(objetos, timestamp);
    }
}
