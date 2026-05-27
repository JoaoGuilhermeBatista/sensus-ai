package com.visaoassistiva.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TtsRequest {
    private String text;
    @JsonProperty("isClose")
    private boolean isClose;

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public boolean getIsClose() {
        return isClose;
    }

    public void setIsClose(boolean isClose) {
        this.isClose = isClose;
    }
}
