package com.frankstack.frankorchestrator.controller;

/**
 * OrchestratorController.java
 * REST Controller for FrankStack Orchestrator API
 * -----------------------
 * Provides REST endpoints for FrankStack microservices orchestration
 * with JSON response formatting and request logging.
 * 
 * Endpoints:
 * - /hello: Test endpoint for API connectivity and health checks
 * - /frankorchestrator: Simple greeting endpoint with parameter support
 * 
 * Features:
 * - Standardized JSON response format with success status
 * - Automatic timestamp generation for all responses
 * - Request parameter logging for debugging and monitoring
 * - Default parameter values for robust error handling
 * - RESTful response structure with consistent data wrapping
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Hello World API Response",
 *     "timestamp": "2025-09-29T10:30:00Z",
 *     "status": "success"
 *   }
 * }
 * 
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
public class OrchestratorController {

    /**
     * Test endpoint for API connectivity and health checks
     * Validates orchestrator service availability and returns
     * standardized JSON response with timestamp and status.
     * 
     * @param word Query parameter for personalized greeting (default: "world")
     * @return Map<String, Object> Standardized JSON response with success status,
     *         message, timestamp, and operational status
     */
    @GetMapping("/hello")
    public Map<String, Object> hello(@RequestParam(defaultValue = "world") String word) {
        System.out.println("Received request with word=" + word);

        // 📊 RESPONSE DATA: Structured data payload with metadata
        Map<String, Object> apiData = new HashMap<>();
        apiData.put("message", "Hello World API Response");
        apiData.put("timestamp", Instant.now().toString());
        apiData.put("status", "success");

        // 🎯 STANDARD RESPONSE: Consistent wrapper format for all API responses
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", apiData);

        return response;
    }

    /**
     * Simple greeting endpoint for FrankStack orchestrator
     * Provides basic greeting functionality with parameterized input
     * and minimal response structure for lightweight operations.
     * 
     * @param word Query parameter for personalized greeting (default: "world")
     * @return Map<String, Object> Simple JSON response with greeting message
     */
    @GetMapping("/frankorchestrator")
    public Map<String, Object> frankorchestrator(@RequestParam(defaultValue = "world") String word) {
        System.out.println("Received request with word=" + word);

        // 💬 SIMPLE RESPONSE: Minimal structure for greeting endpoint
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Hello " + word);

        return response;
    }
}
