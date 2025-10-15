package com.frankaws.frankawsapigateway.controller;

/**
 * HelloController.java
 * -----------------------
 * Simple health-check controller for Frank API Gateway
 * 
 * FEATURES:
 * - Provides a basic /ping endpoint
 * - Confirms the gateway is alive and listening on the configured port
 * - Useful for monitoring, testing, and load balancer checks
 * 
 * Author: Edoardo Sabatini
 * Date: 15 October 2025
 */

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    /**
     * GET /ping
     * -----------
     * Returns a simple string indicating that the Frank API Gateway is running.
     * This endpoint can be used for health checks and basic connectivity tests.
     *
     * @return Status message with port confirmation
     */
    @GetMapping("/ping")
    public String ping() {
        return "Frank API Gateway alive on port 9091 ✅";
    }
}
