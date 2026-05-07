package com.visaoassistiva.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "analise")
@Getter
@Setter
public class Analise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long timestamp;

    @Column(columnDefinition = "TEXT")
    private String resultado;

    @OneToMany(mappedBy = "analise", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ObjetoDetectado> objetos = new ArrayList<>();
}