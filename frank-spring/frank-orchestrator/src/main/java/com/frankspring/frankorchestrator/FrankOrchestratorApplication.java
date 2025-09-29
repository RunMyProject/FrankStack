/**
 * FrankOrchestratorApplication.java
 * -----------------------
 * Main Spring Boot Application for FrankStack Orchestrator
 * 
 * Features:
 * - Scans controller package for REST endpoints
 * - Configures CORS for React dev server
 * - Entry point for Spring Boot application
 * 
 * Author: Edoardo Sabatini
 * Date: 29 September 2025
 */

package com.frankspring.frankorchestrator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication(scanBasePackages = "com.frankstack.frankorchestrator.controller")
public class FrankOrchestratorApplication {

    public static void main(String[] args) {
        SpringApplication.run(FrankOrchestratorApplication.class, args);
    }

    /**
     * Configure CORS to allow calls from React dev server
     */
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
}
