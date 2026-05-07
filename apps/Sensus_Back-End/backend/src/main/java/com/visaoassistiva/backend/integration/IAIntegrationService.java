package com.visaoassistiva.backend.integration;

import com.visaoassistiva.backend.dto.IAResponseDTO;
import com.visaoassistiva.backend.exception.IAServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;

@Service
public class IAIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(IAIntegrationService.class);

    private final WebClient webClient;

    public IAIntegrationService(WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<IAResponseDTO> enviarParaIA(byte[] imagemBytes) {
        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
        bodyBuilder.part("file", new ByteArrayResource(imagemBytes) {
            @Override
            public String getFilename() {
                return "frame.jpg";
            }
        }).contentType(MediaType.IMAGE_JPEG);

        log.debug("[IA] Chamando serviço: POST /analisar");
        long inicio = System.currentTimeMillis();

        return webClient.post()
                .uri("/analisar")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .retrieve()
                .onStatus(status -> status.isError(),
                        resp -> Mono.error(new IAServiceException("Serviço de IA retornou erro: " + resp.statusCode())))
                .bodyToMono(IAResponseDTO.class)
                .timeout(Duration.ofSeconds(5))
                .retryWhen(Retry.fixedDelay(1, Duration.ofMillis(500))
                        .filter(e -> !(e instanceof IAServiceException)))
                .doOnSuccess(resp -> log.debug("[IA] Resposta recebida: objetos={} latencia={}ms",
                        resp != null && resp.objetos() != null ? resp.objetos().size() : 0,
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
}