package com.frankaws.frankawsapigateway;

/**
 * FrankAwsApiGatewayApplication.java
 * -----------------------------------
 * Spring Cloud Gateway - Reactive API Gateway for Frank AWS Stack.
 *
 * FEATURES:
 * - Bootstraps Spring Boot WebFlux application
 * - Defines all reactive routes in Java (no YAML dependency)
 * - Handles CORS for React Dev frontend
 * - Supports CircuitBreaker and fallback route
 * - Ready for LocalStack or AWS integration
 *
 * Author: Edoardo Sabatini
 * Date: 15 October 2025
 */

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import java.util.Arrays;

@SpringBootApplication
public class FrankAwsApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(FrankAwsApiGatewayApplication.class, args);
    }

    /**
     * Configure CORS globally for the React development server.
     */
    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }

    /**
     * Define reactive routes programmatically.
     * Each route proxies a microservice in the LocalStack/AWS environment.
     */
    @Bean
    public RouteLocator gatewayRoutes(RouteLocatorBuilder builder) {
        return builder.routes()

            // 🔹 CARD PAYMENTS
            .route("cardpayment-route", r -> r.path("/api/cardpayment/**")
                .filters(f -> f.stripPrefix(1)
                               .circuitBreaker(c -> c.setName("cardCB")
                                                     .setFallbackUri("forward:/fallback")))
                .uri("http://localhost:8081"))

            // 🔹 HOTEL PAYMENTS
            .route("hotelpayment-route", r -> r.path("/api/hotelpayment/**")
                .filters(f -> f.stripPrefix(1)
                               .circuitBreaker(c -> c.setName("hotelCB")
                                                     .setFallbackUri("forward:/fallback")))
                .uri("http://localhost:8082"))

            // 🔹 TRAVEL PAYMENTS
            .route("travelpayment-route", r -> r.path("/api/travelpayment/**")
                .filters(f -> f.stripPrefix(1)
                               .circuitBreaker(c -> c.setName("travelCB")
                                                     .setFallbackUri("forward:/fallback")))
                .uri("http://localhost:8083"))

            .build();
    }

    /**
     * Simple fallback route for circuit breakers.
     */
    @Bean
    public org.springframework.web.reactive.function.server.RouterFunction<?> fallbackRoute() {
        return org.springframework.web.reactive.function.server.RouterFunctions.route()
            .GET("/fallback", request ->
                org.springframework.web.reactive.function.server.ServerResponse
                    .status(503)
                    .bodyValue("Service temporarily unavailable — please retry later."))
            .build();
    }
}
