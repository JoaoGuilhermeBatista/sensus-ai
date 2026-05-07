package com.visaoassistiva.backend.mapper;

import com.visaoassistiva.backend.dto.IAResponseDTO;
import com.visaoassistiva.backend.dto.response.AnaliseResponseDTO;
import com.visaoassistiva.backend.dto.response.ObjetoDetectadoDTO;
import com.visaoassistiva.backend.model.Analise;
import com.visaoassistiva.backend.model.ObjetoDetectado;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AnaliseMapper {

    public AnaliseResponseDTO toDTO(Analise analise) {
        List<ObjetoDetectadoDTO> objetosDTO = analise.getObjetos().stream()
                .map(this::objetoToDTO)
                .toList();
        return new AnaliseResponseDTO(analise.getId(), analise.getTimestamp(), objetosDTO);
    }

    public Analise toEntity(AnaliseResponseDTO dto) {
        Analise analise = new Analise();
        analise.setId(dto.id());
        analise.setTimestamp(dto.timestamp());
        return analise;
    }

    public ObjetoDetectadoDTO objetoToDTO(ObjetoDetectado objeto) {
        return new ObjetoDetectadoDTO(objeto.getNome(), objeto.getDistancia(), objeto.getIsClose());
    }

    public Analise iaResponseToAnalise(IAResponseDTO iaResponse) {
        Analise analise = new Analise();
        analise.setTimestamp(iaResponse.timestamp() != null
                ? iaResponse.timestamp()
                : System.currentTimeMillis() / 1000);

        if (iaResponse.objetos() != null) {
            List<ObjetoDetectado> objetos = iaResponse.objetos().stream()
                    .map(dto -> {
                        ObjetoDetectado obj = new ObjetoDetectado();
                        obj.setNome(dto.nome());
                        obj.setDistancia(dto.distancia());
                        obj.setIsClose(Boolean.TRUE.equals(dto.isClose()) || "perto".equalsIgnoreCase(dto.distancia()));
                        obj.setAnalise(analise);
                        return obj;
                    })
                    .toList();
            analise.getObjetos().addAll(objetos);
        }

        return analise;
    }
}
