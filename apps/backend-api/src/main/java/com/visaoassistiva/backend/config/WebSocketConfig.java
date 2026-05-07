package com.visaoassistiva.backend.config;

import com.visaoassistiva.backend.websocket.ImagemWebSocketHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private static final int MAX_MESSAGE_SIZE = 512 * 1024; // 512KB

    private final ImagemWebSocketHandler imagemWebSocketHandler;

    public WebSocketConfig(ImagemWebSocketHandler imagemWebSocketHandler) {
        this.imagemWebSocketHandler = imagemWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(imagemWebSocketHandler, "/ws")
                .setAllowedOrigins("*");
    }

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(MAX_MESSAGE_SIZE);
        container.setMaxBinaryMessageBufferSize(MAX_MESSAGE_SIZE);
        container.setMaxSessionIdleTimeout(60_000L);
        return container;
    }
}
