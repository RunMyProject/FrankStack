/**
 * FrankApiGatewayApplication.java
 * Spring Boot API Gateway Application Entry Point
 * -----------------------
 * Minimal configuration for Frank-API-Gateway microservice (30 September 2025)
 * 
 * NOTES:
 * - Entry point of the Spring Boot application
 * - Uses @SpringBootApplication annotation to enable:
 *     • Component scanning
 *     • Auto-configuration
 *     • Spring Boot application context setup
 * - Main method runs the application
 *
 * Author: Edoardo Sabatini
 * Date: 30 September 2025
 */

package com.frankspring.frankapigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FrankApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(FrankApiGatewayApplication.class, args);
    }

}
