package com.frankspring.frankorchestrator.component;

/**
 * FrankKafkaComponent.java
 * -----------------------
 * Kafka listener component for FrankStack Travel Kafka Saga Orchestrator.
 * 
 * NOTES:
 * - Listens to Kafka responses from external services.
 * - Updates saga status in Hazelcast distributed storage.
 * - Emits Server-Sent Events (SSE) to connected frontend clients in real-time.
 * - Handles saga completion flow, including marking completion and closing SSE stream.
 *
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

import javax.swing.plaf.basic.BasicLookAndFeel;

import com.frankspring.frankorchestrator.models.BookingMessage;
import com.frankspring.frankorchestrator.models.BookingResponse;
import com.frankspring.frankorchestrator.models.SagaStatus;
import com.frankspring.frankorchestrator.service.SagaStorageService;
import com.frankspring.frankorchestrator.service.SseEmitterManagerService;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class FrankKafkaComponent {

    @Autowired
    private SagaStorageService sagaStorage;

    @Autowired
    private SseEmitterManagerService sseEmitterManager;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 🎧 Kafka Listener
     * - Listens to responses on "frank-kafka-response-travel" topic
     * - Parses the full JSON message into BookingMessage
     * - Updates saga status in Hazelcast storage
     * - Emits SSE updates to frontend
     */
    @KafkaListener(topics = "frank-kafka-response-travel", groupId = "frank-kafka-group")
    public void listener(String jsonMessage) {
        System.out.println("📨 [KAFKA-LISTENER] Received JSON from Kafka: " + jsonMessage);

        try {
            // 🔄 Deserialize JSON string to BookingResponse
            BookingResponse bookingResponse = objectMapper.readValue(jsonMessage, BookingResponse.class);
            String sagaCorrelationId = bookingResponse.getSagaCorrelationId();

            System.out.println("🔑 [KAFKA-LISTENER] Correlation ID: " + sagaCorrelationId);

            // 💾 Update status to CONFIRMED
            BookingMessage bookingMessage = BookingMessage.builder()
                .sagaCorrelationId(sagaCorrelationId)
                .status(SagaStatus.CONFIRMED)
                .build();

            sagaStorage.updateSaga(bookingMessage);
            
            bookingResponse.setStatus(SagaStatus.CONFIRMED);

            // 📤 Emit SSE event to frontend
            sseEmitterManager.emit(sagaCorrelationId, Map.of(
                "message", "Consumer processing completed",
                "status", SagaStatus.CONFIRMED.name(),
                "sagaCorrelationId", sagaCorrelationId,
                "bookingMessage", bookingResponse,
                "timestamp", Instant.now().toString()
            ));

            // 🏁 Complete SSE stream
            sseEmitterManager.complete(sagaCorrelationId);
            System.out.println("✅ [KAFKA-LISTENER] Saga flow completed for: " + sagaCorrelationId);

        } catch (Exception e) {
            System.err.println("💥 [KAFKA-LISTENER] Error processing Kafka message: " + e.getMessage());
        }
    }
}
