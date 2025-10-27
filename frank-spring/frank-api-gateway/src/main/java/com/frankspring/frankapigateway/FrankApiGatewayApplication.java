/**
 * FrankApiGatewayApplication.java
 * Spring Boot API Gateway Application Entry Point
 * -----------------------
 * Minimal configuration for Frank-API-Gateway microservice
 * 
 * NOTES:
 * - Entry point of the Spring Boot application
 * - Uses @SpringBootApplication annotation to enable:
 *     • Component scanning
 *     • Auto-configuration
 *     • Spring Boot application context setup
 * - Main method runs the application
 *
 * CORS and MVC note:
 * ------------------
 * The WebMvcConfigurer bean is commented out because this API Gateway uses
 * Spring Cloud Gateway, which requires a **reactive stack** (WebFlux), not 
 * the traditional Spring MVC stack.
 *
 * Key points:
 * 1. Spring Cloud Gateway is built on WebFlux (reactive).
 *    It cannot run correctly alongside Spring MVC because:
 *       - MVC uses Servlet-based blocking I/O.
 *       - WebFlux uses non-blocking reactive I/O.
 *       - Combining them leads to startup errors and servlet conflicts.
 *
 * 2. If spring-boot-starter-web (MVC) is present:
 *       - Spring tries to start a Servlet-based web server.
 *       - WebFlux-based Gateway throws exceptions like:
 *           "Spring MVC found on classpath, which is incompatible with Spring Cloud Gateway"
 *
 * 3. Using WebMvcConfigurer here causes compile/runtime errors if the project
 *    only includes WebFlux (reactive). Instead, we configure **CORS** using
 *    a reactive-friendly bean (CorsWebFilter) which works correctly for
 *    Gateway routes and SSE streaming.
 *
 * 4. In short:
 *       - For Spring Cloud Gateway → use WebFlux + CorsWebFilter
 *       - Do not use WebMvcConfigurer or spring-boot-starter-web
 *       - MVC config is only for blocking Servlet apps, not reactive apps.
 *
 * Author: Edoardo Sabatini
 * Date: 27 October 2025
 */

package com.frankspring.frankapigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@SpringBootApplication
public class FrankApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(FrankApiGatewayApplication.class, args);
    }

    /**
     * Configure CORS for React dev server.
     * Ensures preflight OPTIONS and credentials are handled correctly.
     */
    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Allowed origin: React dev server
        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",  // dev server
                 "http://localhost"        // container / prod
        ));

        // Allowed HTTP methods
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Allow all headers
        config.addAllowedHeader("*");

        // Enable cookies / Authorization header
        config.setAllowCredentials(true);

        // Apply this config to all paths
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }

    /* 
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        // Commented out because MVC is incompatible with Spring Cloud Gateway
    }
    */
}
