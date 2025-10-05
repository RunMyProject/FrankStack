package com.frankspring.frankorchestrator.config;

/**
 * RestTemplateConfig.java
 * -----------------------
 * Spring Configuration for RestTemplate Bean
 * 
 * NOTES:
 * - Provides a singleton RestTemplate instance for making HTTP calls
 * - Can be injected wherever HTTP requests to other microservices are needed
 * 
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    /**
     * 🔧 Bean definition for RestTemplate
     * - Allows dependency injection across the Spring application
     * - Supports synchronous HTTP calls to external/internal services
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
