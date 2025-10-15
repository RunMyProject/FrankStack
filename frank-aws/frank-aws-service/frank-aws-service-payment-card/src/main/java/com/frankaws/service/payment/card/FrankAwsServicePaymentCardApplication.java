package com.frankaws.service.payment.card;

/**
 * FrankAwsServicePaymentCardApplication.java
 * ------------------------------------------------------
 * Main entry point for the Payment Card Wrapper Service (Port 18082).
 *
 * PURPOSE:
 * • Bootstraps the Spring Boot application for the Card Payment Producer.
 * • Ensures all components (Controllers, Services, Models) are discovered
 *   via explicit @ComponentScan.
 * • Runs the application with reactive WebFlux stack.
 *
 * COMPONENT SCAN:
 * • Explicit scanning is needed if classes reside outside the main package
 *   structure. Here, we scan:
 *   - com.frankaws.service.payment.card
 *   - com.frankaws.service.payment.card.controller
 *
 * NOTES:
 * • No WebMvcConfigurer or spring-boot-starter-web should be used,
 *   because this service is reactive and uses Spring WebFlux.
 * • The main method launches the Spring Boot application context.
 * • This service handles POST requests on /cardpayment/send and
 *   invokes the PaymentCard Lambda on LocalStack.
 *
 * Author: Edoardo Sabatini
 * Date: 15 October 2025
 */

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication 
@ComponentScan(basePackages = {
    "com.frankaws.service.payment.card",            // Default application base package
    "com.frankaws.service.payment.card.controller"  // Explicitly scan Controller package
})
public class FrankAwsServicePaymentCardApplication {

    public static void main(String[] args) {
        SpringApplication.run(FrankAwsServicePaymentCardApplication.class, args);
    }
}
