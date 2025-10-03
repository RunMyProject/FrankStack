/**
 * OrchestratorSSEController.java
 * -----------------------
 * Saga Pattern SSE Orchestrator with Hazelcast Storage
 * 
 * TWO-STEP APPROACH:
 * 1. POST /frankorchestrator → Creates saga, stores in Hazelcast, returns ID
 * 2. GET /frankorchestrator/{sagaId}/stream → Executes saga with SSE updates
 * 
 * FEATURES:
 * - Stateless orchestration with Hazelcast distributed storage
 * - Real-time SSE streaming for saga execution
 * - Clean separation: storage vs execution
 * - REST call to external service (port 8082)
 * - Kafka response handling via FrankKafkaListener
 * 
 * Author: Edoardo Sabatini
 * Date: 03 October 2025
 */
package com.frankstack.frankorchestrator.controller;

import com.frankstack.frankorchestrator.component.AppPropertiesComponent;
import com.frankstack.frankorchestrator.service.SagaStorageService;
import com.frankstack.frankorchestrator.service.SseEmitterManagerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/frankorchestrator")
public class OrchestratorSSEController {

    @Autowired
    private AppPropertiesComponent appPropertiesComponent;

    @Autowired
    private SagaStorageService sagaStorage;

    @Autowired
    private SseEmitterManagerService sseEmitterManager;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * POST: Creates saga and stores booking context in Hazelcast
     * @param requestBody JSON booking context
     * @return Saga ID for subsequent streaming
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> createSaga(@RequestBody Map<String, Object> requestBody) {
        System.out.println("🚀 [POST] Creating new saga...");
        System.out.println("📦 [POST] Received booking context: " + requestBody);
        
        String sagaId = sagaStorage.createSaga(requestBody);
        
        System.out.println("✅ [POST] Saga created with ID: " + sagaId);
        
        return ResponseEntity.ok(Map.of(
            "sagaId", sagaId,
            "message", "Saga created successfully",
            "streamUrl", "/frankorchestrator/" + sagaId + "/stream"
        ));
    }

    /**
     * GET SSE: Executes saga and streams real-time updates
     * @param sagaId Saga identifier from POST request
     * @return SseEmitter streaming saga execution events
     */
    @GetMapping(value = "/{sagaId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamSagaExecution(@PathVariable String sagaId) {
        System.out.println("🌊 [SSE] Stream requested for saga: " + sagaId);
        
        // 🔍 VALIDATE: Check if saga exists
        if (!sagaStorage.exists(sagaId)) {
            System.err.println("❌ [SSE] Saga not found: " + sagaId);
            SseEmitter emitter = new SseEmitter(60_000L);
            try {
                emitter.send(SseEmitter.event()
                    .data(Map.of(
                        "message", "Saga not found",
                        "status", "error",
                        "sagaId", sagaId
                    ))
                    .build());
                emitter.complete();
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }

        // 📦 RETRIEVE: Get booking context from Hazelcast
        Map<String, Object> bookingContext = sagaStorage.getSaga(sagaId);
        System.out.println("📋 [SSE] Retrieved booking context for saga " + sagaId + ":");
        System.out.println("🔍 [SSE] FULL JSON: " + bookingContext);

        SseEmitter emitter = new SseEmitter(60_000L);
        
        // 📡 REGISTER: Add emitter to manager for Kafka response handling
        sseEmitterManager.addEmitter(sagaId, emitter);

        emitter.onCompletion(() -> {
            System.out.println("🔗 [SSE] Emitter completed for saga: " + sagaId);
            sseEmitterManager.removeEmitter(sagaId);
        });

        emitter.onTimeout(() -> {
            System.out.println("⏳ [SSE] Emitter timed out for saga: " + sagaId);
            emitter.complete();
            sseEmitterManager.removeEmitter(sagaId);
        });

        emitter.onError((e) -> {
            System.err.println("💥 [SSE] Emitter error for saga: " + sagaId + " - " + e.getMessage());
            sseEmitterManager.removeEmitter(sagaId);
        });

        // 🎯 TRIGGER: Call external service on port 8082
        try {
            System.out.println("🚀 [ORCHESTRATOR] Calling external service for saga: " + sagaId);

            String externalServiceUrl = "http://localhost:" + appPropertiesComponent.getKafkaProducerPort() + "/send?msg=" + sagaId;
            
            System.out.println("🔗 [ORCHESTRATOR] External service URL: " + externalServiceUrl);
            
            // Fire-and-forget call to external service
            restTemplate.getForObject(externalServiceUrl, String.class);
            
            System.out.println("✅ [ORCHESTRATOR] External service called successfully");
            
            // Send initial acknowledgment
            emitter.send(SseEmitter.event()
                .data(Map.of(
                    "message", "Saga processing started",
                    "status", "processing",
                    "sagaId", sagaId,
                    "timestamp", Instant.now().toString()
                ))
                .build());
                
        } catch (Exception e) {
            System.err.println("💥 [ORCHESTRATOR] Error calling external service: " + e.getMessage());
            try {
                emitter.send(SseEmitter.event()
                    .data(Map.of(
                        "message", "Error calling external service",
                        "status", "error",
                        "error", e.getMessage()
                    ))
                    .build());
                emitter.completeWithError(e);
            } catch (IOException ioException) {
                emitter.completeWithError(ioException);
            }
        }

        return emitter;
    }

    /**
     * LEGACY: Old GET endpoint with query param (kept for compatibility)
     */
    @GetMapping(value = "/hello", params = "word", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter legacyHelloWorld(@RequestParam String word) {
        System.out.println("🔧 [LEGACY] Hello world called with: " + word);
        SseEmitter emitter = new SseEmitter(60_000L);
        
        try {
            Thread.sleep(1000);
            emitter.send(SseEmitter.event()
                .data(Map.of("message", "Hello " + word, "status", "completed"))
                .build());
            emitter.complete();
        } catch (Exception e) {
            emitter.completeWithError(e);
        }
        
        return emitter;
    }
}
