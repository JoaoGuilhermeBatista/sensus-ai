package com.visaoassistiva.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.visaoassistiva.backend.config.AppProperties;
import com.visaoassistiva.backend.dto.IAResponseDTO;
import com.visaoassistiva.backend.dto.response.AnaliseResponseDTO;
import com.visaoassistiva.backend.dto.response.ObjetoDetectadoDTO;
import com.visaoassistiva.backend.exception.AnaliseNotFoundException;
import com.visaoassistiva.backend.integration.IAIntegrationService;
import com.visaoassistiva.backend.mapper.AnaliseMapper;
import com.visaoassistiva.backend.model.Analise;
import com.visaoassistiva.backend.model.ObjetoDetectado;
import com.visaoassistiva.backend.repository.AnaliseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnaliseServiceTest {

    @Mock
    private IAIntegrationService iaIntegrationService;

    @Mock
    private AnaliseRepository analiseRepository;

    @Mock
    private AnaliseMapper mapper;

    private AppProperties props;
    private AnaliseService analiseService;

    @BeforeEach
    void setUp() {
        props = new AppProperties();
        props.getFiltro().setClassesRelevantes(List.of("person", "chair", "car"));
        props.getPersistencia().setHabilitada(true);

        analiseService = new AnaliseService(
                iaIntegrationService,
                analiseRepository,
                mapper,
                props,
                new ObjectMapper()
        );
    }

    @Test
    void deveProcessarImagemComSucesso() {
        byte[] imagem = new byte[100];
        IAResponseDTO iaResponse = new IAResponseDTO(
                List.of(new ObjetoDetectadoDTO("person", "perto", true)),
                1711370000L
        );
        Analise analise = criarAnalise(List.of(criarObjeto("person", "perto", true)));
        AnaliseResponseDTO responseDTO = new AnaliseResponseDTO(1L, 1711370000L,
                List.of(new ObjetoDetectadoDTO("person", "perto", true)));

        when(iaIntegrationService.enviarParaIA(imagem)).thenReturn(Mono.just(iaResponse));
        when(mapper.iaResponseToAnalise(iaResponse)).thenReturn(analise);
        when(analiseRepository.save(any())).thenReturn(analise);
        when(mapper.toDTO(analise)).thenReturn(responseDTO);

        AnaliseResponseDTO result = analiseService.processarImagem(imagem);

        assertThat(result).isNotNull();
        assertThat(result.objetos()).hasSize(1);
        verify(iaIntegrationService).enviarParaIA(imagem);
        verify(analiseRepository).save(any());
    }

    @Test
    void deveFiltrarClassesIrrelevantes() {
        byte[] imagem = new byte[100];
        IAResponseDTO iaResponse = new IAResponseDTO(
                List.of(
                        new ObjetoDetectadoDTO("person", "perto", true),
                        new ObjetoDetectadoDTO("banana", "longe", false) // irrelevante
                ),
                1711370000L
        );

        Analise analise = criarAnalise(List.of(
                criarObjeto("person", "perto", true),
                criarObjeto("banana", "longe", false)
        ));
        AnaliseResponseDTO responseDTO = new AnaliseResponseDTO(1L, 1711370000L,
                List.of(new ObjetoDetectadoDTO("person", "perto", true)));

        when(iaIntegrationService.enviarParaIA(imagem)).thenReturn(Mono.just(iaResponse));
        when(mapper.iaResponseToAnalise(iaResponse)).thenReturn(analise);
        when(analiseRepository.save(any())).thenReturn(analise);
        when(mapper.toDTO(analise)).thenReturn(responseDTO);

        analiseService.processarImagem(imagem);

        // Verifica que apenas "person" foi mantido no analise antes de salvar
        verify(analiseRepository).save(argThat(a ->
                a.getObjetos().stream().noneMatch(o -> "banana".equals(o.getNome()))
        ));
    }

    @Test
    void deveOrdenarObjetosComIsClosePrimeiro() {
        byte[] imagem = new byte[100];
        IAResponseDTO iaResponse = new IAResponseDTO(List.of(), 1711370000L);

        Analise analise = criarAnalise(List.of(
                criarObjeto("car", "longe", false),
                criarObjeto("person", "perto", true),
                criarObjeto("chair", "medio", false)
        ));
        AnaliseResponseDTO responseDTO = new AnaliseResponseDTO(1L, 1711370000L, List.of());

        when(iaIntegrationService.enviarParaIA(imagem)).thenReturn(Mono.just(iaResponse));
        when(mapper.iaResponseToAnalise(iaResponse)).thenReturn(analise);
        when(analiseRepository.save(any())).thenReturn(analise);
        when(mapper.toDTO(analise)).thenReturn(responseDTO);

        analiseService.processarImagem(imagem);

        verify(analiseRepository).save(argThat(a -> {
            List<ObjetoDetectado> objs = a.getObjetos();
            return Boolean.TRUE.equals(objs.get(0).getIsClose()) // person (perto) primeiro
                    && !Boolean.TRUE.equals(objs.get(1).getIsClose()); // restantes depois
        }));
    }

    @Test
    void deveLancarExcecaoParaImagemVazia() {
        assertThatThrownBy(() -> analiseService.processarImagem(new byte[0]))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("inválida");
    }

    @Test
    void deveLancarExcecaoParaImagemNula() {
        assertThatThrownBy(() -> analiseService.processarImagem(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deveLancarExcecaoParaImagemMuitoGrande() {
        byte[] imagemGrande = new byte[11 * 1024 * 1024];
        assertThatThrownBy(() -> analiseService.processarImagem(imagemGrande))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("10MB");
    }

    @Test
    void naoDevePersistirQuandoPersistenciaDesabilitada() {
        props.getPersistencia().setHabilitada(false);
        byte[] imagem = new byte[100];
        IAResponseDTO iaResponse = new IAResponseDTO(List.of(), 1711370000L);
        Analise analise = criarAnalise(List.of());
        AnaliseResponseDTO responseDTO = new AnaliseResponseDTO(null, 1711370000L, List.of());

        when(iaIntegrationService.enviarParaIA(imagem)).thenReturn(Mono.just(iaResponse));
        when(mapper.iaResponseToAnalise(iaResponse)).thenReturn(analise);
        when(mapper.toDTO(analise)).thenReturn(responseDTO);

        analiseService.processarImagem(imagem);

        verify(analiseRepository, never()).save(any());
    }

    @Test
    void deveBuscarAnalisePorId() {
        Analise analise = criarAnalise(List.of());
        analise.setId(42L);
        AnaliseResponseDTO dto = new AnaliseResponseDTO(42L, 1711370000L, List.of());

        when(analiseRepository.findById(42L)).thenReturn(Optional.of(analise));
        when(mapper.toDTO(analise)).thenReturn(dto);

        AnaliseResponseDTO result = analiseService.buscarPorId(42L);

        assertThat(result.id()).isEqualTo(42L);
    }

    @Test
    void deveLancarAnaliseNotFoundQuandoIdInexistente() {
        when(analiseRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> analiseService.buscarPorId(99L))
                .isInstanceOf(AnaliseNotFoundException.class);
    }

    @Test
    void deveListarAnalisesPaginado() {
        Analise analise = criarAnalise(List.of());
        Page<Analise> page = new PageImpl<>(List.of(analise));
        AnaliseResponseDTO dto = new AnaliseResponseDTO(1L, 1711370000L, List.of());

        when(analiseRepository.findAllByOrderByTimestampDesc(any())).thenReturn(page);
        when(mapper.toDTO(analise)).thenReturn(dto);

        PageRequest pageable = PageRequest.of(0, 10);
        Page<AnaliseResponseDTO> result = analiseService.listarAnalises(pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    private Analise criarAnalise(List<ObjetoDetectado> objetos) {
        Analise analise = new Analise();
        analise.setTimestamp(1711370000L);
        analise.getObjetos().addAll(objetos);
        return analise;
    }

    private ObjetoDetectado criarObjeto(String nome, String distancia, boolean isClose) {
        ObjetoDetectado obj = new ObjetoDetectado();
        obj.setNome(nome);
        obj.setDistancia(distancia);
        obj.setIsClose(isClose);
        return obj;
    }
}