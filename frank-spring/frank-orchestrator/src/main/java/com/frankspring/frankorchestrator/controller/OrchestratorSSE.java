/**
 * OrchestratorSSE.java
 * Saga Pattern SSE Orchestrator Controller
 * -----------------------
 * Spring Boot REST controller that implements Server-Sent Events (SSE)
 * for real-time saga pattern orchestration simulation.
 * 
 * Simulates distributed transaction processing across microservices:
 * - Service A: Saga Orchestrator initialization
 * - Service B: Transport booking service
 * - Service C: Accommodation booking service
 * 
 * Features:
 * - Async microservice chain execution with CompletableFuture
 * - Real-time progress updates via SSE
 * - Configurable service delays for realistic simulation
 * - Comprehensive error handling and logging
 * - Automatic completion event after all services
 * 
 * Endpoint:
 * GET /hello?word=world - Streams saga execution events in real-time
 * 
 * Author: Edoardo Sabatini
 * Date: 29 September 2025
 */

package com.frankstack.frankorchestrator.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ThreadLocalRandom;

@RestController
public class OrchestratorSSE {

    /**
     * SSE endpoint for saga pattern orchestration simulation
     * Streams real-time updates as services complete processing
     * 
     * @param word Trigger parameter for the orchestration process
     * @return SseEmitter that streams service completion events
     */
    @GetMapping(value = "/hello", params = "word", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamUpdates(@RequestParam String word) {
        System.out.println("🚀 [SERVER] SSE request received! Parameter word = '" + word + "'");
        System.out.println("⏳ [SERVER] Creating new SseEmitter with 60 second timeout...");

        SseEmitter emitter = new SseEmitter(60_000L);

        System.out.println("🌀 [SERVER] Starting microservices chain in background...");

        // 🎯 SAGA ORCHESTRATION: Execute services sequentially with CompletableFuture chain
        CompletableFuture.runAsync(() -> sendUpdate(emitter, "Service A", "success"))
            .thenRun(() -> sendUpdate(emitter, "Service B", "success"))
            .thenRun(() -> sendUpdate(emitter, "Service C", "success"))
            .thenRun(() -> {
                System.out.println("✅ [SERVER] All microservices completed! Sending final event...");
                try {
                    // 🏁 FINAL COMPLETION: Send success event when all services complete
                    emitter.send(SseEmitter.event()
                        .data(Map.of(
                            "message", "All services completed ✅",
                            "status", "completed",
                            "timestamp", Instant.now().toString()
                        ))
                        .build());
                    System.out.println("📤 [SERVER] Final event sent successfully!");
                    emitter.complete();
                    System.out.println("🏁 [SERVER] SseEmitter completed successfully.");
                } catch (IOException e) {
                    System.err.println("💥 [SERVER] ERROR sending final event: " + e.getMessage());
                    emitter.completeWithError(e);
                }
            })
            .exceptionally(throwable -> {
                // ❌ ERROR HANDLING: Handle exceptions in the CompletableFuture chain
                System.err.println("🔥 [SERVER] Exception in CompletableFuture chain: " + throwable.getMessage());
                emitter.completeWithError(throwable);
                return null;
            });

        System.out.println("📥 [SERVER] Returning emitter to client...");
        return emitter;
    }

    /**
     * Simulates microservice processing and sends SSE update
     * 
     * @param emitter SSE emitter for sending events to client
     * @param serviceName Name of the microservice being processed
     * @param status Processing status ("success" or "error")
     */
    private void sendUpdate(SseEmitter emitter, String serviceName, String status) {
        System.out.println("🛠️ [SERVER] Starting processing for " + serviceName + "...");
        try {
            // ⏱️ SERVICE DELAY: Simulate processing time (configurable)
            // int delay = ThreadLocalRandom.current().nextInt(3000, 10000); // Random delay
            int delay = 1000; // Fixed 1-second delay for testing
            System.out.println("⏱️ [SERVER] " + serviceName + " will wait " + delay + " ms...");
            Thread.sleep(delay);

            String message = serviceName + " completed";
            Map<String, String> eventData = Map.of(
                "message", message,
                "status", status,
                "timestamp", Instant.now().toString()
            );

            System.out.println("📤 [SERVER] Sending event for " + serviceName + ": " + eventData);

            // 📡 SSE EVENT: Send service completion update to client
            emitter.send(SseEmitter.event()
                .data(eventData)
                .build());

            System.out.println("✔️ [SERVER] Event for " + serviceName + " sent successfully!");

        } catch (InterruptedException e) {
            // 🚨 INTERRUPTION: Handle thread interruption gracefully
            Thread.currentThread().interrupt();
            System.err.println("⚠️ [SERVER] " + serviceName + " was interrupted!");
            sendError(emitter, serviceName + " interrupted");
        } catch (IOException e) {
            // 🔌 CONNECTION ERROR: Handle SSE connection issues
            System.err.println("❌ [SERVER] I/O error while sending for " + serviceName + ": " + e.getMessage());
            sendError(emitter, serviceName + " failed ❌");
        }
    }

    /**
     * Sends error event via SSE when service processing fails
     * 
     * @param emitter SSE emitter for sending error events
     * @param errorMsg Descriptive error message
     */
    private void sendError(SseEmitter emitter, String errorMsg) {
        System.out.println("🚨 [SERVER] Sending error message: " + errorMsg);
        try {
            emitter.send(SseEmitter.event()
                .data(Map.of(
                    "message", errorMsg,
                    "status", "error",
                    "timestamp", Instant.now().toString()
                ))
                .build());
            System.out.println("📤 [SERVER] Error message sent.");
        } catch (IOException e) {
            System.err.println("💥 [SERVER] Cannot send error: " + e.getMessage());
            emitter.completeWithError(e);
        }
    }
}
