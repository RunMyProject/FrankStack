/**
 * Orchestrator.java
 * -----------------------
 * REST Controller for FrankStack Orchestrator API
 * 
 * Provides endpoints for:
 * - Simple test /hello endpoint returning JSON
 * - /frankorchestrator endpoint returning greeting messages
 * 
 * Features:
 * - JSON responses with status, message, timestamp
 * - Logging of incoming requests
 * 
 * Author: Edoardo Sabatini
 * Date: 29 September 2025
 */

package com.frankstack.frankorchestrator.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
public class Orchestrator {

    /**
     * Test endpoint for API connectivity
     * @param word query parameter (default "world")
     * @return JSON with message, timestamp, and status
     */
    @GetMapping("/hello")
    public Map<String, Object> hello(@RequestParam(defaultValue = "world") String word) {
        System.out.println("Received request with word=" + word);

        Map<String, Object> apiData = new HashMap<>();
        apiData.put("message", "Hello World API Response");
        apiData.put("timestamp", Instant.now().toString());
        apiData.put("status", "success");

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", apiData);

        return response;
    }

    /**
     * Simple greeting endpoint
     * @param word query parameter (default "world")
     * @return JSON with message
     */
    @GetMapping("/frankorchestrator")
    public Map<String, Object> frankorchestrator(@RequestParam(defaultValue = "world") String word) {
        System.out.println("Received request with word=" + word);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Hello " + word);

        return response;
    }
}
