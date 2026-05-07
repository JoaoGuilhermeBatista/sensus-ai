package com.visaoassistiva.backend.repository;

import com.visaoassistiva.backend.model.Analise;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnaliseRepository extends JpaRepository<Analise, Long> {

    Page<Analise> findAllByOrderByTimestampDesc(Pageable pageable);
}