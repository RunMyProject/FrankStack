/**
 * FrankOrchestratorApplication.java
 * -----------------------
 * Main Spring Boot Application for FrankStack Orchestrator
 * 
 * NOTES:
 * - Scans the controller package for REST endpoints
 * - CORS configuration is handled by API Gateway proxy
 * - Entry point for Spring Boot application
 * - To test React calls directly without API Gateway, uncomment the CORS bean below
 *
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

package com.frankspring.frankorchestrator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class FrankOrchestratorApplication {

    public static void main(String[] args) {
        SpringApplication.run(FrankOrchestratorApplication.class, args);
    }

    /**
     * NB: CORS configuration moved to API Gateway proxy.
     * -----------------------------------------------------------------
     * Uncomment the following bean to enable CORS directly for testing React
     * calls without going through the API Gateway.
     *
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")                       // all routes
                        .allowedOrigins("http://localhost:5173") // React dev server
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
    */
}
