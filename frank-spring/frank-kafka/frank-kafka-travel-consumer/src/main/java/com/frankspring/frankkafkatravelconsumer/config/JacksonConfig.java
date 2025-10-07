package com.frankspring.frankkafkatravelconsumer.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * JacksonConfig.java
 * -----------------------
 * Register JavaTimeModule so java.time types (Instant, LocalDateTime, etc.)
 * are serialized/deserialized correctly in JSON across the app.
 *
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Register Java 8 time module
        mapper.registerModule(new JavaTimeModule());

        // Prefer ISO-8601 strings rather than timestamps
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        return mapper;
    }
}
