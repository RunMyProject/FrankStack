/**
 * FrankKafkaComponent.java
 * -----------------------
 * Kafka listener component for FrankStack Travel Kafka Saga Orchestrator
 * 
 * NOTES:
 * - Listens to Kafka responses from external services.
 * - Updates saga status in Hazelcast distributed storage.
 * - Emits Server-Sent Events (SSE) to connected frontend clients in real-time.
 * - Handles saga completion flow, including marking completion and closing SSE stream.
 *
 * Author: Edoardo Sabatini
 * Date: 03 October 2025
 */

package com.frankstack.frankorchestrator.component;

import com.frankstack.frankorchestrator.service.SagaStorageService;
import com.frankstack.frankorchestrator.service.SseEmitterManagerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

@Component
public class FrankKafkaComponent {

    @Autowired
    private SagaStorageService sagaStorage;

    @Autowired
    private SseEmitterManagerService sseEmitterManager;

    /**
     * 🎧 Kafka Listener
     * - Listens to responses on "frank-kafka-response-travel" topic
     * - Updates Hazelcast storage with saga status
     * - Emits SSE updates to frontend
     * - Completes saga flow when confirmed
     *
     * @param data Correlation ID (saga ID) from Kafka
     */
    @KafkaListener(topics = "frank-kafka-response-travel", groupId = "frank-kafka-group")
    void listener(String data) {
        System.out.println("📨 [KAFKA-LISTENER] Received from Kafka: " + data);

        String correlationId = data.trim();
        System.out.println("🔑 [KAFKA-LISTENER] Correlation ID: " + correlationId);

        // 🔍 Verify saga exists in Hazelcast storage
        if (!sagaStorage.exists(correlationId)) {
            System.err.println("⚠️ [KAFKA-LISTENER] Saga not found for ID: " + correlationId);
            return;
        }

        // 💾 Update saga status to CONFIRMED
        System.out.println("💾 [KAFKA-LISTENER] Updating saga status in Hazelcast...");
        sagaStorage.updateSagaStatus(correlationId, "CONFIRMED");

        // 📤 Emit SSE event to frontend
        System.out.println("📤 [KAFKA-LISTENER] Sending SSE update to client...");
        sseEmitterManager.emit(correlationId, Map.of(
            "message", "Consumer processing completed",
            "status", "CONFIRMED",
            "sagaId", correlationId,
            "timestamp", Instant.now().toString()
        ));

        // 🏁 Complete SSE stream for this saga
        System.out.println("🏁 [KAFKA-LISTENER] Completing SSE stream for saga: " + correlationId);
        sseEmitterManager.complete(correlationId);

        System.out.println("✅ [KAFKA-LISTENER] Saga flow completed for: " + correlationId);
    }
}
