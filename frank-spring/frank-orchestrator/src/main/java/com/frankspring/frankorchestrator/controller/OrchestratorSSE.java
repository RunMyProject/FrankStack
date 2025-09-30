/**
 * OrchestratorSSE.java
 * Saga Pattern SSE Orchestrator with Hazelcast Storage
 * -----------------------
 * Two-step approach:
 * 1. POST /frankorchestrator → Creates saga, stores in Hazelcast, returns ID
 * 2. GET /frankorchestrator/{sagaId}/stream → Executes saga with SSE updates
 * 
 * Features:
 * - Stateless orchestration with Hazelcast distributed storage
 * - Real-time SSE streaming for saga execution
 * - Clean separation: storage vs execution
 * - Prints full JSON context during execution
 * 
 * Author: Edoardo Sabatini
 * Date: 30 September 2025
 */

package com.frankstack.frankorchestrator.controller;

import com.frankstack.frankorchestrator.service.SagaStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/frankorchestrator")
public class OrchestratorSSE {

    @Autowired
    private SagaStorageService sagaStorage;

    /**
     * POST: Creates saga and stores booking context in Hazelcast
     * 
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
     * 
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

        // 🎯 SAGA EXECUTION: Process services with context
        CompletableFuture.runAsync(() -> sendUpdate(emitter, "Service A", "success", bookingContext))
            .thenRun(() -> sendUpdate(emitter, "Service B", "success", bookingContext))
            .thenRun(() -> sendUpdate(emitter, "Service C", "success", bookingContext))
            .thenRun(() -> {
                System.out.println("✅ [SSE] All services completed for saga: " + sagaId);
                try {
                    emitter.send(SseEmitter.event()
                        .data(Map.of(
                            "message", "All services completed ✅",
                            "status", "completed",
                            "timestamp", Instant.now().toString(),
                            "sagaId", sagaId
                        ))
                        .build());
                    emitter.complete();
                    
                    // 🗑️ CLEANUP: Remove saga after completion (optional)
                    // sagaStorage.deleteSaga(sagaId);
                    
                } catch (IOException e) {
                    System.err.println("💥 [SSE] Error sending completion: " + e.getMessage());
                    emitter.completeWithError(e);
                }
            })
            .exceptionally(throwable -> {
                System.err.println("🔥 [SSE] Exception in saga execution: " + throwable.getMessage());
                emitter.completeWithError(throwable);
                return null;
            });

        return emitter;
    }

    /**
     * Simulates service processing with booking context
     */
    private void sendUpdate(SseEmitter emitter, String serviceName, String status, Map<String, Object> context) {
        System.out.println("🛠️ [SERVICE] Processing " + serviceName + "...");
        System.out.println("📦 [SERVICE] Using context: " + context);
        
        try {
            Thread.sleep(1000); // Simulate processing
            
            Map<String, Object> eventData = Map.of(
                "message", serviceName + " completed",
                "status", status,
                "timestamp", Instant.now().toString(),
                "service", serviceName
            );

            System.out.println("📤 [SERVICE] Sending event: " + eventData);
            
            emitter.send(SseEmitter.event()
                .data(eventData)
                .build());
                
            System.out.println("✔️ [SERVICE] " + serviceName + " event sent!");

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("⚠️ [SERVICE] " + serviceName + " interrupted");
            sendError(emitter, serviceName + " interrupted");
        } catch (IOException e) {
            System.err.println("❌ [SERVICE] I/O error: " + e.getMessage());
            sendError(emitter, serviceName + " failed");
        }
    }

    /**
     * Sends error event via SSE
     */
    private void sendError(SseEmitter emitter, String errorMsg) {
        System.out.println("🚨 [ERROR] " + errorMsg);
        try {
            emitter.send(SseEmitter.event()
                .data(Map.of(
                    "message", errorMsg,
                    "status", "error",
                    "timestamp", Instant.now().toString()
                ))
                .build());
        } catch (IOException e) {
            System.err.println("💥 [ERROR] Cannot send error: " + e.getMessage());
            emitter.completeWithError(e);
        }
    }

    /**
     * LEGACY: Old GET endpoint with query param (kept for compatibility)
     */
    @GetMapping(value = "/hello", params = "word", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter legacyHelloWorld(@RequestParam String word) {
        System.out.println("🔧 [LEGACY] Hello world called with: " + word);
        SseEmitter emitter = new SseEmitter(60_000L);
        
        CompletableFuture.runAsync(() -> {
            try {
                Thread.sleep(1000);
                emitter.send(SseEmitter.event()
                    .data(Map.of("message", "Hello " + word, "status", "completed"))
                    .build());
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        
        return emitter;
    }
}