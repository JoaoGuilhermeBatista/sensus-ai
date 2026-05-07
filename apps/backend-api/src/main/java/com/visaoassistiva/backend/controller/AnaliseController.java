package com.visaoassistiva.backend.controller;

import com.visaoassistiva.backend.dto.request.ImagemRequestDTO;
import com.visaoassistiva.backend.dto.response.AnaliseResponseDTO;
import com.visaoassistiva.backend.dto.response.ApiResponseWrapper;
import com.visaoassistiva.backend.service.AnaliseService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;

@RestController
@RequestMapping("/api")
public class AnaliseController {

    private static final Logger log = LoggerFactory.getLogger(AnaliseController.class);

    private final AnaliseService analiseService;

    public AnaliseController(AnaliseService analiseService) {
        this.analiseService = analiseService;
    }

    @PostMapping("/analisar")
    public ResponseEntity<ApiResponseWrapper<AnaliseResponseDTO>> analisar(
            @RequestBody @Valid ImagemRequestDTO dto) {
        byte[] imagem;
        try {
            imagem = Base64.getDecoder().decode(dto.imagemBase64());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponseWrapper.erro("Imagem base64 inválida"));
        }
        log.debug("[ANALISE] Iniciando análise via REST: frameSize={} bytes", imagem.length);
        AnaliseResponseDTO result = analiseService.processarImagem(imagem);
        return ResponseEntity.ok(ApiResponseWrapper.ok(result));
    }

    @GetMapping("/analises")
    public ResponseEntity<Page<AnaliseResponseDTO>> listar(
            @PageableDefault(size = 20, sort = "timestamp") Pageable pageable) {
        return ResponseEntity.ok(analiseService.listarAnalises(pageable));
    }

    @GetMapping("/analises/{id}")
    public ResponseEntity<ApiResponseWrapper<AnaliseResponseDTO>> buscarPorId(@PathVariable Long id) {
        AnaliseResponseDTO result = analiseService.buscarPorId(id);
        return ResponseEntity.ok(ApiResponseWrapper.ok(result));
    }
}