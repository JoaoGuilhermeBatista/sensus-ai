package com.visaoassistiva.backend.repository;

import com.visaoassistiva.backend.model.ObjetoDetectado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ObjetoDetectadoRepository extends JpaRepository<ObjetoDetectado, Long> {

    List<ObjetoDetectado> findByAnaliseId(Long analiseId);

    List<ObjetoDetectado> findByIsCloseTrue();
}
