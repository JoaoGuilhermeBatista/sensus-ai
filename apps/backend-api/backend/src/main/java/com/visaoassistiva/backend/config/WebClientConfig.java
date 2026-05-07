package com.visaoassistiva.backend.config;

import io.netty.channel.ChannelOption;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient(AppProperties props) {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, props.getIa().getTimeoutConnectMs())
                .responseTimeout(Duration.ofMillis(props.getIa().getTimeoutReadMs()));

        return WebClient.builder()
                .baseUrl(props.getIa().getBaseUrl())
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .codecs(conf -> conf.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
    }
}
