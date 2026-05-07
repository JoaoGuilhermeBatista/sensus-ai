package com.visaoassistiva.backend.dto.response;

public record ApiResponseWrapper<T>(
        boolean sucesso,
        String mensagem,
        T dados,
        Long timestamp
) {
    public static <T> ApiResponseWrapper<T> ok(T dados) {
        return new ApiResponseWrapper<>(true, "OK", dados, System.currentTimeMillis() / 1000);
    }

    public static <T> ApiResponseWrapper<T> erro(String mensagem) {
        return new ApiResponseWrapper<>(false, mensagem, null, System.currentTimeMillis() / 1000);
    }
}