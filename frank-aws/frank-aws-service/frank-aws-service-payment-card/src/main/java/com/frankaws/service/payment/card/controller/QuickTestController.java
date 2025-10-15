package com.frankaws.service.payment.card.controller;

// ================================================================
// QuickTestController.java
// ------------------------------------------------
// Lightweight REST Controller for sanity checks / quick tests
//
// PURPOSE:
// • Provides a simple GET endpoint (/hello) to verify service availability
// • Confirms that the Wrapper Service on port 18082 is running
// • Useful for smoke testing, health checks, or debugging local stacks
//
// TECH NOTES:
// • Uses Spring WebFlux (@RestController + Mono) for reactive flow
// • Returns a Mono<String> containing a static message
//
// USAGE:
// • Can be called from browser, curl, or automated test scripts
// • Ensures that the microservice responds without invoking Lambda
//
// Author: Edoardo Sabatini
// Date: 15 October 2025
// ================================================================

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
public class QuickTestController {

    /**
     * Simple GET endpoint to check service health.
     * @return Mono<String> confirming the service is alive.
     */
    @GetMapping("/hello")
    public Mono<String> hello() {
        // Returns a static message confirming the Wrapper Service is active.
        return Mono.just("Hello from Wrapper Service (18082)");
    }
}
