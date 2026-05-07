package com.visaoassistiva.backend.exception;

public class IAServiceException extends RuntimeException {

    public IAServiceException(String message) {
        super(message);
    }

    public IAServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}