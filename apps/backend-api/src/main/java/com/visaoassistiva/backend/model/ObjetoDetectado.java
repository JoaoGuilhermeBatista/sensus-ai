package com.visaoassistiva.backend.model;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
@Entity
@Table(name = "objeto_detectado")
@Getter
@Setter
public class ObjetoDetectado {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String nome;
    private String distancia;
    @Column(name = "is_close")
    private Boolean isClose;
    @Column(name = "bbox_x")
    private Double bboxX;
    @Column(name = "bbox_y")
    private Double bboxY;
    @Column(name = "bbox_width")
    private Double bboxWidth;
    @Column(name = "bbox_height")
    private Double bboxHeight;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analise_id")
    private Analise analise;
}