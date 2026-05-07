package com.visaoassistiva.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.visaoassistiva.backend.config.AppProperties;
import com.visaoassistiva.backend.dto.IAResponseDTO;
import com.visaoassistiva.backend.dto.response.AnaliseResponseDTO;
import com.visaoassistiva.backend.exception.AnaliseNotFoundException;
import com.visaoassistiva.backend.integration.IAIntegrationService;
import com.visaoassistiva.backend.mapper.AnaliseMapper;
import com.visaoassistiva.backend.model.Analise;
import com.visaoassistiva.backend.model.ObjetoDetectado;
import com.visaoassistiva.backend.repository.AnaliseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class AnaliseService {

    private static final Logger log = LoggerFactory.getLogger(AnaliseService.class);
    private static final int MAX_IMAGEM_BYTES = 10 * 1024 * 1024;

    private final IAIntegrationService iaIntegrationService;
    private final AnaliseRepository analiseRepository;
    private final AnaliseMapper mapper;
    private final AppProperties props;
    private final ObjectMapper objectMapper;

    public AnaliseService(IAIntegrationService iaIntegrationService,
                          AnaliseRepository analiseRepository,
                          AnaliseMapper mapper,
                          AppProperties props,
                          ObjectMapper objectMapper) {
        this.iaIntegrationService = iaIntegrationService;
        this.analiseRepository = analiseRepository;
        this.mapper = mapper;
        this.props = props;
        this.objectMapper = objectMapper;
    }

    public AnaliseResponseDTO processarImagem(byte[] imagem) {
        validarImagem(imagem);

        IAResponseDTO iaResponse = iaIntegrationService.enviarParaIA(imagem).block();

        Analise analise = mapper.iaResponseToAnalise(iaResponse);

        List<ObjetoDetectado> filtrados = filtrar(analise.getObjetos());
        List<ObjetoDetectado> ordenados = ordenar(filtrados);
        analise.getObjetos().clear();
        analise.getObjetos().addAll(ordenados);

        persistirResultado(analise, iaResponse);

        boolean persistida = props.getPersistencia().isHabilitada() && analise.getId() != null;
        log.debug("[ANALISE] Concluída: objetos={} (após filtro) persistida={} id={}",
                ordenados.size(), persistida, analise.getId());

        return mapper.toDTO(analise);
    }

    public Page<AnaliseResponseDTO> listarAnalises(Pageable pageable) {
        return analiseRepository.findAllByOrderByTimestampDesc(pageable)
                .map(mapper::toDTO);
    }

    public AnaliseResponseDTO buscarPorId(Long id) {
        Analise analise = analiseRepository.findById(id)
                .orElseThrow(() -> new AnaliseNotFoundException(id));
        return mapper.toDTO(analise);
    }

    private void validarImagem(byte[] imagem) {
        if (imagem == null || imagem.length == 0) {
            throw new IllegalArgumentException("Imagem inválida ou vazia");
        }
        if (imagem.length > MAX_IMAGEM_BYTES) {
            throw new IllegalArgumentException("Imagem muito grande (máximo 10MB)");
        }
    }

    private List<ObjetoDetectado> filtrar(List<ObjetoDetectado> objetos) {
        List<String> classes = props.getFiltro().getClassesRelevantes();
        if (classes.isEmpty()) {
            return objetos;
        }
        return objetos.stream()
                .filter(o -> classes.contains(o.getNome()))
                .toList();
    }

    private List<ObjetoDetectado> ordenar(List<ObjetoDetectado> objetos) {
        return objetos.stream()
                .sorted(Comparator.comparing((ObjetoDetectado o) -> !Boolean.TRUE.equals(o.getIsClose()))
                        .thenComparing(ObjetoDetectado::getNome))
                .toList();
    }

    private void persistirResultado(Analise analise, IAResponseDTO iaResponse) {
        if (!props.getPersistencia().isHabilitada()) {
            return;
        }
        try {
            analise.setResultado(objectMapper.writeValueAsString(iaResponse));
            analiseRepository.save(analise);
        } catch (Exception e) {
            log.warn("[ANALISE] Falha ao persistir análise: {}", e.getMessage());
        }
    }
}