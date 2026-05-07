package com.visaoassistiva.backend.exception;

public class AnaliseNotFoundException extends RuntimeException {

    public AnaliseNotFoundException(Long id) {
        super("Análise não encontrada: id=" + id);
    }
}